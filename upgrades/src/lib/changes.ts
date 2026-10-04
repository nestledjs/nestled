import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { git, gitOutput } from './git';

/**
 * Bookkeeping for which paths an apply run changes, so that undoing the run touches those paths and
 * nothing else. A run may start on a dirty tree (`--allow-dirty`); whatever the user had uncommitted
 * there is theirs, and no rollback may revert it.
 *
 * Paths here are relative to the repository root, the form `git status --porcelain` reports.
 */

/** `git --literal-pathspecs`: a path containing `*` or `?` is a file name, never a glob. */
const LITERAL = '--literal-pathspecs';
/** Keep argument lists well under any platform's argv limit. */
const CHUNK = 100;

function chunks<T>(items: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) result.push(items.slice(i, i + CHUNK));
  return result;
}

function isNestledPath(path: string): boolean {
  return path === '.nestled' || path.startsWith('.nestled/');
}

/**
 * Every path with uncommitted changes at this moment — staged, unstaged, or untracked (each file of an
 * untracked directory individually) — excluding our own `.nestled/` bookkeeping, the same exclusion
 * `hasUncommittedChanges` makes. Both sides of a staged rename are included.
 */
export function dirtyPaths(cwd: string): Set<string> {
  const result = git(cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const paths = new Set<string>();
  if (result.status !== 0) return paths;
  const entries = result.stdout.split('\0');
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.length < 4) continue;
    paths.add(entry.slice(3));
    // `XY new\0old\0`: a rename or copy carries its source as the next entry.
    if (/[RC]/.test(entry.slice(0, 2)) && entries[i + 1]) paths.add(entries[++i]);
  }
  return new Set([...paths].filter((path) => !isNestledPath(path)));
}

/** C-style unquoting of a path git quoted (`"a/\303\274.txt"`); octal escapes are UTF-8 bytes. */
function unquote(raw: string): string {
  if (!raw.startsWith('"')) return raw;
  const bytes: number[] = [];
  const simple: Record<string, number> = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };
  for (let i = 1; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') break;
    if (ch !== '\\') {
      bytes.push(...Buffer.from(ch, 'utf8'));
      continue;
    }
    const next = raw[++i];
    if (/[0-7]/.test(next)) {
      const octal = raw.slice(i, i + 3);
      bytes.push(parseInt(octal, 8));
      i += octal.length - 1;
    } else {
      bytes.push(simple[next] ?? next.charCodeAt(0));
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

/** The path on a `---`/`+++`/`rename from` line: unquoted, `a/`/`b/` stripped, `/dev/null` dropped. */
function headerPath(raw: string, stripPrefix: boolean): string | null {
  let value = raw.startsWith('"') ? unquote(raw) : raw.replace(/\t.*$/, '');
  if (value === '/dev/null') return null;
  if (stripPrefix) value = value.replace(/^[ab]\//, '');
  return value || null;
}

/** `diff --git a/x b/x` when the section has no other path line (mode-only, binary). */
function gitHeaderPaths(rest: string): string[] {
  const quoted = rest.match(/^("(?:[^"\\]|\\.)*"|\S+) ("(?:[^"\\]|\\.)*"|\S+)$/);
  if (quoted && (quoted[1].startsWith('"') || quoted[2].startsWith('"'))) {
    return [quoted[1], quoted[2]].map((part) => headerPath(part, true)).filter((p): p is string => !!p);
  }
  // Unquoted `a/<p> b/<p>` with an identical path on both sides (no rename): split down the middle.
  if (rest.startsWith('a/') && (rest.length - 5) % 2 === 0) {
    const half = (rest.length - 5) / 2;
    const path = rest.slice(2, 2 + half);
    if (rest.slice(2 + half) === ` b/${path}`) return [path];
  }
  return [];
}

function globToRegExp(glob: string): RegExp {
  let source = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === '*' && glob[i + 1] === '*') {
      source += '.*';
      i++;
    } else if (ch === '*') source += '[^/]*';
    else if (ch === '?') source += '[^/]';
    else source += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`);
}

/**
 * Every path a unified diff would create, modify, delete or rename (both sides), relative to the
 * directory `git apply` runs in, minus paths matching `excludes` (the `--exclude` globs passed to
 * `git apply`). Hunk bodies are skipped by their line counts, so a removed line that happens to read
 * `-- a/x` is never mistaken for a header.
 */
export function patchPaths(diffText: string, excludes: string[] = []): string[] {
  const lines = diffText.split('\n');
  const paths = new Set<string>();
  let section: string[] = [];
  let gitHeader: string | null = null;
  const flush = () => {
    const found = section.length ? section : gitHeader ? gitHeaderPaths(gitHeader) : [];
    found.forEach((path) => paths.add(path));
    section = [];
    gitHeader = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('diff --git ')) {
      flush();
      gitHeader = line.slice('diff --git '.length);
    } else if (line.startsWith('@@ ')) {
      const counts = line.match(/^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/);
      let oldLeft = counts ? Number(counts[1] ?? 1) : 0;
      let newLeft = counts ? Number(counts[2] ?? 1) : 0;
      while ((oldLeft > 0 || newLeft > 0) && i + 1 < lines.length) {
        const body = lines[++i];
        if (body.startsWith('\\')) continue;
        if (body.startsWith('-')) oldLeft--;
        else if (body.startsWith('+')) newLeft--;
        else {
          oldLeft--;
          newLeft--;
        }
      }
    } else if (line.startsWith('--- ') || line.startsWith('+++ ')) {
      const path = headerPath(line.slice(4), true);
      if (path) section.push(path);
    } else {
      const moved = line.match(/^(?:rename|copy) (?:from|to) (.+)$/);
      if (moved && gitHeader !== null) {
        const path = headerPath(moved[1], false);
        if (path) section.push(path);
      }
    }
  }
  flush();
  const excluded = excludes.map(globToRegExp);
  return [...paths].filter((path) => !excluded.some((pattern) => pattern.test(path)));
}

type PriorState = { kind: 'tracked' } | { kind: 'absent' } | { kind: 'untracked'; contents: Buffer };

/**
 * The paths one apply run changes, each with how it looked before the run first touched it, so a
 * rollback can put back exactly those paths and leave every other file alone.
 *
 * Call `willTouch` before writing a path. Its state at that moment is the pre-run state, because
 * the run never writes a path it has not declared, and a path the user had uncommitted is refused
 * before it gets here.
 */
export class RunChanges {
  private readonly prior = new Map<string, PriorState>();

  /** `root` is the repository root; `startCommit` is HEAD before the run ('' on an unborn branch). */
  constructor(private readonly root: string, private readonly startCommit: string) {}

  get paths(): string[] {
    return [...this.prior.keys()];
  }

  has(path: string): boolean {
    return this.prior.has(path);
  }

  willTouch(paths: Iterable<string>): void {
    const fresh = [...new Set(paths)].filter((path) => path && !this.prior.has(path));
    if (!fresh.length) return;
    const tracked = this.trackedAtStart(fresh);
    for (const path of fresh) {
      const absolute = join(this.root, path);
      if (tracked.has(path)) this.prior.set(path, { kind: 'tracked' });
      else if (!existsSync(absolute)) this.prior.set(path, { kind: 'absent' });
      // An untracked file the user has, invisible to `git status` because it is ignored.
      else if (lstatSync(absolute).isFile())
        this.prior.set(path, { kind: 'untracked', contents: readFileSync(absolute) });
    }
  }

  /**
   * Record paths something the run did has already changed (a package install's side effects).
   * Only paths that were clean before that step may be passed: each is either tracked at the start
   * commit, or did not exist.
   */
  didChange(paths: Iterable<string>): void {
    const fresh = [...new Set(paths)].filter((path) => path && !this.prior.has(path));
    const tracked = this.trackedAtStart(fresh);
    for (const path of fresh) this.prior.set(path, tracked.has(path) ? { kind: 'tracked' } : { kind: 'absent' });
  }

  /**
   * Put `paths` (default: every path this run touched) back to their pre-run state, in both the
   * index and the working tree. Nothing outside them is read or written.
   */
  restore(paths: Iterable<string> = this.prior.keys()): void {
    const targets = [...new Set(paths)].filter((path) => this.prior.has(path));
    const tracked = targets.filter((path) => this.prior.get(path)?.kind === 'tracked');
    const others = targets.filter((path) => this.prior.get(path)?.kind !== 'tracked');
    for (const chunk of chunks(tracked)) {
      git(this.root, [LITERAL, 'checkout', this.startCommit, '--', ...chunk]);
    }
    for (const chunk of chunks(others)) {
      git(this.root, [LITERAL, 'rm', '--cached', '-q', '--ignore-unmatch', '--', ...chunk]);
    }
    for (const path of others) {
      const state = this.prior.get(path);
      const absolute = join(this.root, path);
      if (state?.kind === 'untracked') {
        mkdirSync(dirname(absolute), { recursive: true });
        writeFileSync(absolute, state.contents);
      } else if (existsSync(absolute) && !lstatSync(absolute).isDirectory()) {
        rmSync(absolute, { force: true });
        this.pruneEmptyParents(path);
      }
    }
  }

  /** Paths of `paths` present in the start commit's tree. */
  private trackedAtStart(paths: string[]): Set<string> {
    const tracked = new Set<string>();
    if (!this.startCommit) return tracked;
    for (const chunk of chunks(paths)) {
      const out = git(this.root, [
        LITERAL,
        'ls-tree',
        '-r',
        '-z',
        '--name-only',
        '--full-tree',
        this.startCommit,
        '--',
        ...chunk,
      ]);
      out.stdout
        .split('\0')
        .filter(Boolean)
        .forEach((path) => tracked.add(path));
    }
    return tracked;
  }

  /** Remove directories a created file left empty, up to (never including) the repository root. */
  private pruneEmptyParents(path: string): void {
    let dir = dirname(path);
    while (dir && dir !== '.') {
      const absolute = join(this.root, dir);
      try {
        if (readdirSync(absolute).length) return;
        rmdirSync(absolute);
      } catch {
        return;
      }
      dir = dirname(dir);
    }
  }
}

/**
 * Commit only `paths`, leaving anything else the user has staged or modified out of the commit and
 * exactly as it was. Returns the new HEAD (short), or the unchanged HEAD when none of `paths` changed.
 */
export function commitPaths(root: string, message: string, paths: string[]): string {
  const unique = [...new Set(paths)];
  for (const chunk of chunks(unique)) {
    // `add -A` of a path that is neither on disk nor in the index fails the whole call; skip those.
    const known = new Set(
      git(root, [LITERAL, 'ls-files', '-z', '--', ...chunk])
        .stdout.split('\0')
        .filter(Boolean),
    );
    const addable = chunk.filter((path) => known.has(path) || existsSync(join(root, path)));
    if (addable.length) git(root, [LITERAL, 'add', '-A', '--', ...addable]);
  }
  // Exactly the paths with something staged: a path that ended up unchanged would fail `--only`.
  const staged = chunks(unique).flatMap((chunk) =>
    git(root, [LITERAL, 'diff', '--cached', '--name-only', '-z', '--', ...chunk])
      .stdout.split('\0')
      .filter(Boolean),
  );
  if (staged.length) {
    const args = [
      'commit',
      '--no-gpg-sign',
      '-q',
      '-m',
      message,
      '--only',
      '--pathspec-from-file=-',
      '--pathspec-file-nul',
    ];
    git(root, [LITERAL, ...args], `${staged.join('\0')}\0`);
  }
  return gitOutput(root, ['rev-parse', '--short', 'HEAD']);
}
