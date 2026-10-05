import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmdirSync,
  rmSync,
  Stats,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { git, gitOutput, NO_HOOKS } from './git';

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
  // Never fall back to an empty set: that would treat the user's uncommitted work as not there.
  if (result.status !== 0) throw new Error(`Unable to list uncommitted changes: ${result.stderr || result.stdout}`);
  const paths = new Set<string>();
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

/** How many files `ignoredPaths` lists inside collapsed ignored directories before giving up on one. */
const IGNORED_SCAN_LIMIT = 20000;

/**
 * Ignored paths that exist right now, as `git status --ignored` reports them, as a test of whether a
 * path existed (as an ignored file) at this moment. Git collapses an ignored directory to one entry,
 * so its files are listed here directly, up to a limit; inside a directory too large to list (a
 * `node_modules`), every path counts as pre-existing, which can only ever leave a file behind.
 */
export function ignoredPaths(cwd: string): (path: string) => boolean {
  // --untracked-files: ignored files are only listed while untracked ones are, whatever the config says.
  const result = git(cwd, ['status', '--porcelain=v1', '-z', '--ignored=traditional', '--untracked-files=normal']);
  if (result.status !== 0) throw new Error(`Unable to list ignored files: ${result.stderr || result.stdout}`);
  const entries = result.stdout
    .split('\0')
    .filter((entry) => entry.startsWith('!! '))
    .map((entry) => entry.slice(3));
  const files = new Set(entries.filter((entry) => !entry.endsWith('/')));
  const unlisted: string[] = [];
  let budget = IGNORED_SCAN_LIMIT;
  for (const dir of entries.filter((entry) => entry.endsWith('/'))) {
    const found = budget > 0 ? listFiles(cwd, dir, budget) : null;
    if (!found) {
      // Out of allowance (or over it here): this and every later directory get the cautious answer.
      budget = 0;
      unlisted.push(dir);
      continue;
    }
    budget -= found.length;
    found.forEach((path) => files.add(path));
  }
  return (path) => files.has(path) || unlisted.some((dir) => path.startsWith(dir));
}

/** C-style unquoting of a path git quoted (`"a/\303\274.txt"`); octal escapes are UTF-8 bytes. */
function unquote(raw: string): string {
  if (!raw.startsWith('"')) return raw;
  const bytes: number[] = [];
  const simple: Record<string, number> = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };
  for (let i = 1; i < raw.length; i++) {
    // Whole code points: with core.quotePath=false an emoji arrives literally, as a surrogate pair.
    const ch = String.fromCodePoint(raw.codePointAt(i) as number);
    if (ch === '"') break;
    if (ch !== '\\') {
      bytes.push(...Buffer.from(ch, 'utf8'));
      i += ch.length - 1;
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

/** Drop the first path component, as `git apply` does by default (`-p1`): `a/x`, `old/x` -> `x`. */
function stripComponent(path: string): string | null {
  const slash = path.indexOf('/');
  return slash > 0 && slash < path.length - 1 ? path.slice(slash + 1) : null;
}

/** The path on a `---`/`+++`/`rename from` line: unquoted, `/dev/null` dropped, first component stripped. */
function headerPath(raw: string, stripPrefix: boolean): string | null {
  const value = raw.startsWith('"') ? unquote(raw) : raw.replace(/\t.*$/, '');
  if (value === '/dev/null' || !value) return null;
  return stripPrefix ? stripComponent(value) : value;
}

/** `diff --git <p>/x <p>/x` when the section has no other path line (mode-only, binary). */
function gitHeaderPaths(rest: string): string[] {
  const quoted = rest.match(/^("(?:[^"\\]|\\.)*"|\S+) ("(?:[^"\\]|\\.)*"|\S+)$/);
  if (quoted && (quoted[1].startsWith('"') || quoted[2].startsWith('"'))) {
    return [quoted[1], quoted[2]].map((part) => headerPath(part, true)).filter((p): p is string => !!p);
  }
  // Unquoted, and the same path on both sides (there is no rename without rename lines): find the
  // space that splits the header into two sides that agree once their prefixes are stripped.
  for (let i = rest.indexOf(' '); i > 0; i = rest.indexOf(' ', i + 1)) {
    const left = stripComponent(rest.slice(0, i));
    if (left && left === stripComponent(rest.slice(i + 1))) return [left];
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

/** What is at a path on disk, captured so it can be put back exactly. */
type FileState =
  | { kind: 'absent' }
  | { kind: 'file'; contents: Buffer; mode: number }
  | { kind: 'link'; target: string }
  /** A directory or special file: never captured, never overwritten. */
  | { kind: 'other' };

/** A path's state together with the state of each directory above it (a real directory, or a link). */
interface Captured {
  state: FileState;
  ancestors: { absolute: string; state: FileState }[];
}

function lstatOrNull(absolute: string): Stats | null {
  try {
    return lstatSync(absolute);
  } catch {
    return null;
  }
}

/** `other` for directories here; `ancestorState` is what tells a directory from a link above a path. */
function readState(absolute: string): FileState {
  const stat = lstatOrNull(absolute);
  if (!stat) return { kind: 'absent' };
  if (stat.isSymbolicLink()) return { kind: 'link', target: readlinkSync(absolute) };
  if (stat.isFile()) return { kind: 'file', contents: readFileSync(absolute), mode: stat.mode & 0o777 };
  return { kind: 'other' };
}

function sameState(a: FileState, b: FileState): boolean {
  if (a.kind === 'file' && b.kind === 'file') return a.mode === b.mode && a.contents.equals(b.contents);
  if (a.kind === 'link' && b.kind === 'link') return a.target === b.target;
  return a.kind === b.kind;
}

/** A directory reads as `other`; anything else in a directory's place reads as what it is. */
function ancestorState(absolute: string): FileState {
  const stat = lstatOrNull(absolute);
  if (!stat) return { kind: 'absent' };
  if (stat.isSymbolicLink()) return { kind: 'link', target: readlinkSync(absolute) };
  return stat.isDirectory() ? { kind: 'other' } : { kind: 'file', contents: Buffer.alloc(0), mode: 0 };
}

function capture(root: string, path: string, state: FileState = readState(join(root, path))): Captured {
  const ancestors: Captured['ancestors'] = [];
  let absolute = root;
  for (const part of path.split('/').slice(0, -1)) {
    absolute = join(absolute, part);
    ancestors.push({ absolute, state: ancestorState(absolute) });
  }
  return { state, ancestors };
}

/**
 * Whether every parent is as captured. A parent that did not exist may since have become a real
 * directory (the run creating `new-dir/file`), but never a link or a file.
 */
function ancestorsIntact(captured: Captured): boolean {
  return captured.ancestors.every(({ absolute, state }) => {
    const now = ancestorState(absolute);
    if (state.kind === 'absent') return now.kind === 'absent' || now.kind === 'other';
    return state.kind === 'file' ? now.kind === 'file' : sameState(state, now);
  });
}

/**
 * Put back each directory or directory link above a captured path that a step replaced, top down,
 * before anything below it is touched: otherwise a link a step put in place of a directory would send
 * the restore somewhere else entirely. A link the user already had stays. Returns false when the
 * path had no real parent when captured, so there is nothing to restore it into.
 */
function restoreAncestors(captured: Captured): boolean {
  for (const { absolute, state } of captured.ancestors) {
    if (state.kind === 'absent' || state.kind === 'file') return false;
    const now = ancestorState(absolute);
    if (sameState(state, now)) continue;
    if (now.kind !== 'absent') rmSync(absolute, { recursive: now.kind === 'other', force: true });
    if (state.kind === 'link') symlinkSync(state.target, absolute);
    else mkdirSync(absolute);
  }
  return true;
}

/** Whether `captured` still describes what is at `absolute` and above it. */
function unchanged(absolute: string, captured: Captured): boolean {
  return ancestorsIntact(captured) && sameState(captured.state, readState(absolute));
}

/**
 * Put `captured` back at `absolute`. An absent path is only cleared while its parents are as they were
 * (through a replaced parent, the same name means some other file); a directory there is left alone.
 */
function restoreCaptured(absolute: string, captured: Captured): void {
  const { state } = captured;
  if (state.kind === 'other') return;
  if (state.kind === 'absent') {
    const stat = ancestorsIntact(captured) ? lstatOrNull(absolute) : null;
    if (stat && !stat.isDirectory()) rmSync(absolute, { force: true });
    return;
  }
  if (!restoreAncestors(captured)) return;
  const stat = lstatOrNull(absolute);
  if (stat) rmSync(absolute, { recursive: stat.isDirectory(), force: true });
  if (state.kind === 'link') symlinkSync(state.target, absolute);
  else {
    writeFileSync(absolute, state.contents);
    // Exactly: a mode passed to writeFileSync is filtered through the process umask.
    chmodSync(absolute, state.mode);
  }
}

type PriorState = { kind: 'tracked' } | { kind: 'captured'; captured: Captured };

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
  /** Pre-existing ignored files a step surfaced: restored on rollback, never committed as the run's. */
  private readonly preserved = new Set<string>();

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
      // Anything not tracked is either absent or a file the user has that git ignores: keep a copy.
      this.prior.set(
        path,
        tracked.has(path) ? { kind: 'tracked' } : { kind: 'captured', captured: capture(this.root, path) },
      );
    }
  }

  /**
   * Record paths something the run did has already changed (an install's or a hook's side effects).
   * Only paths that were clean before that step may be passed. Each was tracked at the start commit,
   * did not exist, or existed but was ignored (`existedIgnored`): a step that changes an ignore rule,
   * or force-adds and commits, can surface a file it never wrote. That last kind is the user's: it is
   * kept as it is now and, after a rollback, put back the same way, unstaged. Returns the paths among
   * `paths` that the run now owns, which never include the user's.
   */
  didChange(paths: Iterable<string>, existedIgnored: (path: string) => boolean = () => false): string[] {
    const unique = [...new Set(paths)].filter(Boolean);
    const fresh = unique.filter((path) => !this.prior.has(path));
    const tracked = this.trackedAtStart(fresh);
    for (const path of fresh) {
      if (tracked.has(path)) this.prior.set(path, { kind: 'tracked' });
      else if (existedIgnored(path)) {
        this.prior.set(path, { kind: 'captured', captured: capture(this.root, path) });
        this.preserved.add(path);
      } else {
        this.prior.set(path, { kind: 'captured', captured: capture(this.root, path, { kind: 'absent' }) });
      }
    }
    return unique.filter((path) => this.prior.has(path) && !this.preserved.has(path));
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
      // Hook-free: a post-checkout hook could rewrite the user's uncommitted files mid-rollback.
      git(this.root, [...NO_HOOKS, LITERAL, 'checkout', this.startCommit, '--', ...chunk]);
    }
    // -f: the index entry may match neither HEAD nor the file on disk (staged by us, then rewritten).
    for (const chunk of chunks(others)) {
      git(this.root, [LITERAL, 'rm', '--cached', '-f', '-q', '--ignore-unmatch', '--', ...chunk]);
    }
    for (const path of others) {
      const prior = this.prior.get(path);
      if (prior?.kind !== 'captured') continue;
      restoreCaptured(join(this.root, path), prior.captured);
      if (prior.captured.state.kind === 'absent') this.pruneEmptyParents(path);
    }
  }

  /** Paths of `paths` present in the start commit's tree. */
  private trackedAtStart(paths: string[]): Set<string> {
    const tracked = new Set<string>();
    if (!this.startCommit) return tracked;
    for (const chunk of chunks(paths)) {
      const args = [LITERAL, 'ls-tree', '-r', '-z', '--name-only', '--full-tree', this.startCommit, '--', ...chunk];
      git(this.root, args)
        .stdout.split('\0')
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
 * Every file and link under `dir` (repository-root-relative, ending in `/`), as root-relative paths,
 * without following directory links. With `limit`, null once more than that many are found.
 */
export function listFiles(root: string, dir: string, limit = Infinity): string[] | null {
  const result: string[] = [];
  const walk = (relative: string): boolean => {
    let entries;
    try {
      entries = readdirSync(join(root, relative), { withFileTypes: true });
    } catch {
      // Unreadable (or gone): an incomplete listing must not pass for a complete one.
      return false;
    }
    for (const entry of entries) {
      const path = `${relative}${entry.name}`;
      if (entry.isDirectory()) {
        if (!walk(`${path}/`)) return false;
      } else {
        result.push(path);
        if (result.length > limit) return false;
      }
    }
    return true;
  };
  return walk(dir) ? result : null;
}

/** Index entries (`mode sha stage`, one per stage) of each of `paths`; a path with none is not in the index. */
function indexEntries(root: string, paths: string[]): Map<string, string[]> {
  const entries = new Map<string, string[]>();
  for (const chunk of chunks(paths)) {
    const out = git(root, [LITERAL, 'ls-files', '-s', '-z', '--', ...chunk]).stdout;
    for (const record of out.split('\0').filter(Boolean)) {
      const tab = record.indexOf('\t');
      const path = record.slice(tab + 1);
      entries.set(path, [...(entries.get(path) ?? []), record.slice(0, tab)]);
    }
    // `ls-files -s` shows an intent-to-add entry (`git add -N`) as a staged empty blob; mark it.
    const status = git(root, [LITERAL, 'status', '--porcelain=v2', '-z', '--untracked-files=no', '--', ...chunk]);
    for (const record of status.stdout.split('\0')) {
      const fields = record.split(' ');
      if (fields[0] !== '1' || fields[1] !== '.A') continue;
      const path = fields.slice(8).join(' ');
      entries.set(
        path,
        (entries.get(path) ?? []).map((entry) => `${entry} ${INTENT_TO_ADD}`),
      );
    }
  }
  return entries;
}

const INTENT_TO_ADD = 'intent-to-add';

/** The user's uncommitted work at a set of paths: what is on disk, and what is staged. */
export interface UserState {
  files: Map<string, Captured>;
  index: Map<string, string[]>;
}

/** Capture `paths` as they are now, on disk and in the index. */
export function snapshotFiles(root: string, paths: Iterable<string>): UserState {
  const list = [...new Set(paths)];
  const files = new Map<string, Captured>();
  for (const path of list) files.set(path, capture(root, path));
  return { files, index: indexEntries(root, list) };
}

/**
 * Put back every snapshotted path whose file (contents, mode, symlink target, or presence) or index
 * entry no longer matches, and return those paths. Used around steps that run third-party code (a
 * package install, verification commands) on a dirty tree, so a script that rewrites, replaces or
 * re-stages a file the user has uncommitted work in cannot cost them that work.
 */
export function restoreChangedFiles(root: string, snapshot: UserState): string[] {
  const restored = new Set<string>();
  for (const [path, before] of snapshot.files) {
    const absolute = join(root, path);
    if (before.state.kind === 'other' || unchanged(absolute, before)) continue;
    // A directory where the user had nothing was not theirs; leave it.
    if (before.state.kind === 'absent' && lstatOrNull(absolute)?.isDirectory()) continue;
    try {
      restoreCaptured(absolute, before);
    } catch {
      // Still reported: the note is blocked and the run rolled back, never recorded as applied.
    }
    restored.add(path);
  }
  const now = indexEntries(root, [...snapshot.files.keys()]);
  const changed = [...snapshot.files.keys()].filter(
    (path) => (snapshot.index.get(path) ?? []).join('\n') !== (now.get(path) ?? []).join('\n'),
  );
  if (changed.length) {
    for (const chunk of chunks(changed)) {
      git(root, [LITERAL, 'update-index', '--force-remove', '--', ...chunk]);
    }
    const intents = changed.filter((path) => snapshot.index.get(path)?.some((entry) => entry.endsWith(INTENT_TO_ADD)));
    const info = changed
      .filter((path) => !intents.includes(path))
      .flatMap((path) => (snapshot.index.get(path) ?? []).map((entry) => `${entry}\t${path}\0`));
    if (info.length) git(root, ['update-index', '-z', '--index-info'], info.join(''));
    for (const chunk of chunks(intents)) git(root, [LITERAL, 'add', '-N', '--', ...chunk]);
    changed.forEach((path) => restored.add(path));
  }
  return [...restored];
}

/**
 * Commit only `paths`, leaving anything else the user has staged or modified out of the commit and
 * exactly as it was. Returns the new HEAD (short), the unchanged HEAD when none of `paths` changed,
 * or '' when staging or committing failed (a commit hook rejecting it, say), like `commitAll`.
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
    const addable = chunk.filter((path) => known.has(path) || lstatOrNull(join(root, path)));
    if (addable.length && git(root, [LITERAL, 'add', '-A', '--', ...addable]).status !== 0) return '';
  }
  // Exactly the paths with something staged: a path that ended up unchanged would fail `--only`.
  // --no-renames: a staged rename must list its source too, or `--only` leaves the deletion behind.
  const staged = chunks(unique).flatMap((chunk) =>
    git(root, [LITERAL, 'diff', '--cached', '--no-renames', '--name-only', '-z', '--', ...chunk])
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
    if (git(root, [LITERAL, ...args], `${staged.join('\0')}\0`).status !== 0) return '';
  }
  return gitOutput(root, ['rev-parse', '--short', 'HEAD']);
}
