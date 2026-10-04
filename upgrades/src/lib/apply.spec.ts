import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyRun } from './apply';
import { initBaseline, readUpgradeLog, writeUpgradeLog } from './baseline';

function git(cwd: string, args: string[]): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if ((result.status ?? 1) !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout ?? '';
}

let repo: string;
let feedDir: string;

/** Build a valid unified diff by making the edit, capturing `git diff`, reverting. */
function makeDiff(file: string, contents: string): string {
  writeFileSync(join(repo, file), contents, 'utf8');
  const diff = git(repo, ['diff']);
  git(repo, ['checkout', '--', file]);
  return diff;
}

function writeManifest(release: string, ceiling: string): void {
  const manifest = [
    'schemaVersion: 1',
    'channels:',
    `  stable: "${ceiling}"`,
    'releases:',
    `  - id: "${release}"`,
    '    templateCommit: abc123',
    '    notes:',
    '      - id: note-1',
    '        title: Change hello',
    '        delivery: code-patch',
    '        patch: patches/change.diff',
  ].join('\n');
  writeFileSync(join(feedDir, 'manifest.yaml'), manifest, 'utf8');
}

interface RawRelease {
  id: string;
  notes: string[];
}

/** Writes a manifest from pre-rendered YAML note blocks, for scenarios writeManifest can't express. */
function writeManifestReleases(ceiling: string, releases: RawRelease[]): void {
  const lines = ['schemaVersion: 1', 'channels:', `  stable: "${ceiling}"`, 'releases:'];
  for (const release of releases) {
    lines.push(`  - id: "${release.id}"`, '    templateCommit: abc123', '    notes:', ...release.notes);
  }
  writeFileSync(join(feedDir, 'manifest.yaml'), lines.join('\n'), 'utf8');
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'nestled-repo-'));
  feedDir = mkdtempSync(join(tmpdir(), 'nestled-feed-'));
  mkdirSync(join(feedDir, 'patches'), { recursive: true });
  git(repo, ['init', '-q']);
  git(repo, ['config', 'user.email', 'test@example.com']);
  git(repo, ['config', 'user.name', 'Test']);
  git(repo, ['config', 'commit.gpgsign', 'false']);
  writeFileSync(join(repo, 'hello.txt'), 'hello\n', 'utf8');
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-q', '-m', 'init']);
  // baseline below the release so it is pending, channel stable
  initBaseline(repo, { at: '2026.01.0', channel: 'stable' });
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(feedDir, { recursive: true, force: true });
});

describe('applyRun', () => {
  it('applies a clean code-patch, advances the baseline, records the outcome', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    writeManifest('2026.02.0', '2026.02.0');

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });

    expect(result.status).toBe('applied');
    expect(result.applied.map((n) => n.id)).toEqual(['note-1']);
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('hello world\n');
    expect(result.baselineRelease).toBe('2026.02.0');

    const log = readUpgradeLog(repo);
    expect(log.upgrades['note-1']).toBe('applied');
    expect(log.template.baselineRelease).toBe('2026.02.0');
    // the change is committed on the upgrade branch
    expect(git(repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim()).toBe('nestled-update/stable-2026.02.0');
  });

  it('rolls back cleanly and blocks when a patch does not apply', () => {
    // build the diff against "hello", then change the file so the context no longer matches
    const diff = makeDiff('hello.txt', 'hello world\n');
    writeFileSync(join(feedDir, 'patches', 'change.diff'), diff, 'utf8');
    writeFileSync(join(repo, 'hello.txt'), 'completely different\n', 'utf8');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'diverge']);
    writeManifest('2026.02.0', '2026.02.0');

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });

    expect(result.status).toBe('blocked');
    expect(result.blocked?.id).toBe('note-1');
    // code changes rolled back; only our own .nestled/ bookkeeping may differ
    const dirty = git(repo, ['status', '--porcelain'])
      .split('\n')
      .filter((line) => line.trim() && !line.includes('.nestled/'));
    expect(dirty).toEqual([]);
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('completely different\n');

    const log = readUpgradeLog(repo);
    expect(log.upgrades['note-1']).toBe('blocked');
    // baseline did not advance
    expect(log.template.baselineRelease).toBe('2026.01.0');
  });

  it('reports up-to-date when the baseline already covers the channel', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    // baseline == ceiling → nothing pending
    initBaseline(repo, { at: '2026.02.0', channel: 'stable' });
    writeManifest('2026.02.0', '2026.02.0');

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });
    expect(result.status).toBe('up-to-date');
    expect(result.applied).toEqual([]);
  });

  it('advances the baseline past a release whose notes were all recorded terminal by hand', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    initBaseline(repo, { at: '2026.01.0', channel: 'stable' });
    writeManifest('2026.02.0', '2026.02.0');
    const log = readUpgradeLog(repo);
    log.upgrades['note-1'] = { status: 'adapted', notes: 'Adapted by hand.' };
    writeUpgradeLog(repo, log);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'record hand adaptation']);

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });
    expect(result.status).toBe('up-to-date');
    expect(result.baselineRelease).toBe('2026.02.0');
    const after = readUpgradeLog(repo);
    expect(after.template.baselineRelease).toBe('2026.02.0');
    expect(after.template.lastReviewedCommit).toBe('abc123');
    expect(after.upgrades['note-1']).toEqual({ status: 'adapted', notes: 'Adapted by hand.' });
  });

  it('never advances the baseline on a channel with no published pointer', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    initBaseline(repo, { at: '2026.01.0', channel: 'canary' });
    writeManifest('2026.02.0', '2026.02.0'); // only a stable pointer exists
    const log = readUpgradeLog(repo);
    log.upgrades['note-1'] = { status: 'adapted' };
    writeUpgradeLog(repo, log);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'record']);

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });
    expect(result.status).toBe('up-to-date');
    expect(readUpgradeLog(repo).template.baselineRelease).toBe('2026.01.0');
  });

  it('does not re-attempt a note recorded as blocked, and leaves git alone', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    writeManifest('2026.02.0', '2026.02.0');
    const log = readUpgradeLog(repo);
    log.upgrades['note-1'] = { status: 'blocked', notes: 'Held on purpose.' };
    writeUpgradeLog(repo, log);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'record block']);
    const before = git(repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });
    expect(result.status).toBe('blocked');
    expect(result.blocked?.id).toBe('note-1');
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('hello\n');
    expect(git(repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim()).toBe(before);
    expect(readUpgradeLog(repo).upgrades['note-1']).toEqual({ status: 'blocked', notes: 'Held on purpose.' });
    expect(readUpgradeLog(repo).template.baselineRelease).toBe('2026.01.0');
  });

  it('holds baseline below a pure intent-only note and reports it for review', () => {
    writeManifestReleases('2026.02.0', [
      {
        id: '2026.02.0',
        notes: [
          '      - id: note-review',
          '        title: Annotate calendar-day columns',
          '        delivery: intent-only',
          '        intent: Add @dateOnly to calendar-day fields in your own schema.',
          '        review: Walk schema.prisma and annotate every calendar-day field with @dateOnly.',
        ],
      },
    ]);

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });

    expect(result.status).toBe('needs-review');
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0]).toMatchObject({
      id: 'note-review',
      review: 'Walk schema.prisma and annotate every calendar-day field with @dateOnly.',
    });
    // nothing to diff for a pure intent-only note; the tree is unchanged
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('hello\n');

    const log = readUpgradeLog(repo);
    expect(log.upgrades['note-review']).toBe('needs-review');
    // baseline stays below the release with unreviewed work, not just below the channel ceiling
    expect(log.template.baselineRelease).toBe('2026.01.0');
  });

  it('applies the mechanical part of a hybrid note that also needs review, and stops the ladder there', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    writeManifestReleases('2026.03.0', [
      {
        id: '2026.02.0',
        notes: [
          '      - id: note-hybrid-review',
          '        title: Scaffold + annotate',
          '        delivery: hybrid',
          '        intent: Apply the scaffolding patch, then annotate your own schema.',
          '        patch: patches/change.diff',
          '        review: Annotate calendar-day fields per the intent above.',
        ],
      },
      {
        id: '2026.03.0',
        notes: [
          '      - id: note-later',
          '        title: Should stay pending',
          '        delivery: code-patch',
          '        patch: patches/change.diff',
        ],
      },
    ]);

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });

    expect(result.status).toBe('needs-review');
    // the mechanical part still lands
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('hello world\n');
    // only the review-carrying note ran this pass; the later release's note was left pending
    expect(result.applied.map((n) => n.id)).toEqual(['note-hybrid-review']);

    const log = readUpgradeLog(repo);
    expect(log.upgrades['note-hybrid-review']).toBe('needs-review');
    expect(log.upgrades['note-later']).toBeUndefined();
    // held below 2026.02.0, not advanced to the 2026.03.0 ceiling
    expect(log.template.baselineRelease).toBe('2026.01.0');
  });

  it('proceeds past a reviewed note once it is hand-resolved to a terminal outcome', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    writeManifestReleases('2026.03.0', [
      {
        id: '2026.02.0',
        notes: [
          '      - id: note-review',
          '        title: Needs a human',
          '        delivery: intent-only',
          '        intent: Do the judgment call.',
          '        review: Go do the judgment call.',
        ],
      },
      {
        id: '2026.03.0',
        notes: [
          '      - id: note-later',
          '        title: Mechanical follow-up',
          '        delivery: code-patch',
          '        patch: patches/change.diff',
        ],
      },
    ]);

    const first = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });
    expect(first.status).toBe('needs-review');
    expect(readUpgradeLog(repo).template.baselineRelease).toBe('2026.01.0');

    // simulate the human/agent finishing the review and hand-editing the ledger, same as `blocked`
    const log = readUpgradeLog(repo);
    log.upgrades['note-review'] = 'applied';
    writeUpgradeLog(repo, log);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'resolve review']);

    const second = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });
    expect(second.status).toBe('applied');
    expect(second.applied.map((n) => n.id)).toEqual(['note-later']);
    expect(readUpgradeLog(repo).template.baselineRelease).toBe('2026.03.0');
  });

  it("uses the note's own verification instead of the consumer's failing auto-detected script", () => {
    // The consumer's own `test` script needs infra an unattended rollout can't assume is running
    // (a database, Docker) and would fail on pre-existing issues unrelated to this note. Without
    // note-level verification, `inferVerification` would run this failing script and block.
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'consumer', scripts: { test: 'exit 1' } }),
      'utf8',
    );
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'add failing test script']);

    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    writeManifestReleases('2026.02.0', [
      {
        id: '2026.02.0',
        notes: [
          '      - id: note-1',
          '        title: Change hello',
          '        delivery: code-patch',
          '        patch: patches/change.diff',
          '        verification:',
          '          - "true"',
        ],
      },
    ]);

    // no `verification` option passed: this proves the note's own field is what wins, not a test override
    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml') });

    expect(result.status).toBe('applied');
    expect(result.verification).toEqual([{ command: 'true', status: 0, output: '', error: '' }]);
  });
});

describe('applyRun --allow-dirty', () => {
  const NOTES = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', ''].join('\n');
  const USER_EDIT = 'my own unfinished edit\n';

  /** A committed, unrelated file the user then edits without committing. */
  function dirtyUnrelatedFile(): void {
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(join(repo, 'docs', 'notes.md'), NOTES, 'utf8');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'add notes']);
    writeFileSync(join(repo, 'docs', 'notes.md'), NOTES + USER_EDIT, 'utf8');
  }

  function untrackedUnrelatedFile(): void {
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(join(repo, 'docs', 'draft.md'), 'not committed yet\n', 'utf8');
  }

  /** A patch for hello.txt that will not apply, because hello.txt is then committed with other content. */
  function conflictingPatch(name: string, { withBlob = true } = {}): void {
    let diff = makeDiff('hello.txt', 'hello world\n');
    // Without the `index` line, --3way has no base blob to merge from and fails outright.
    if (!withBlob) diff = diff.replace(/^index .*\n/m, '');
    writeFileSync(join(feedDir, 'patches', name), diff, 'utf8');
  }

  function divergeHello(): void {
    writeFileSync(join(repo, 'hello.txt'), 'completely different\n', 'utf8');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'diverge']);
  }

  function codePatchNote(id: string, patch: string): string[] {
    return [
      `      - id: ${id}`,
      `        title: ${id}`,
      '        delivery: code-patch',
      `        patch: patches/${patch}`,
    ];
  }

  const status = (path: string) => git(repo, ['status', '--porcelain', '--', path]).trim();
  const run = (extra: Record<string, unknown> = {}) =>
    applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [], allowDirty: true, ...extra });

  it('keeps an unrelated uncommitted edit when a failed 3-way attempt is undone', () => {
    conflictingPatch('change.diff');
    divergeHello();
    dirtyUnrelatedFile();
    writeManifest('2026.02.0', '2026.02.0');

    const result = run();

    expect(result.status).toBe('blocked');
    expect(result.blocked?.reason).toContain('did not apply cleanly');
    expect(readFileSync(join(repo, 'docs', 'notes.md'), 'utf8')).toBe(NOTES + USER_EDIT);
    // the 3-way attempt's conflict markers are gone
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('completely different\n');
    expect(status('hello.txt')).toBe('');
    expect(readUpgradeLog(repo).upgrades['note-1']).toBe('blocked');
  });

  it('keeps an unrelated uncommitted edit when a patch without a 3-way base fails', () => {
    conflictingPatch('change.diff', { withBlob: false });
    divergeHello();
    dirtyUnrelatedFile();
    writeManifest('2026.02.0', '2026.02.0');

    const result = run();

    expect(result.status).toBe('blocked');
    expect(readFileSync(join(repo, 'docs', 'notes.md'), 'utf8')).toBe(NOTES + USER_EDIT);
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('completely different\n');
  });

  it('rolls back earlier notes of the run but not the user’s edits, tracked or untracked', () => {
    writeFileSync(join(feedDir, 'patches', 'good.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    // note-2 creates a file and edits hello.txt against content it will not find
    writeFileSync(join(repo, 'added.txt'), 'from the template\n', 'utf8');
    git(repo, ['add', '-N', 'added.txt']);
    writeFileSync(join(repo, 'hello.txt'), 'something else\n', 'utf8');
    const bad = git(repo, ['diff']).replace(/^index .*\n/gm, (line) => (line.includes('0000000') ? line : ''));
    git(repo, ['reset', '-q']);
    rmSync(join(repo, 'added.txt'));
    git(repo, ['checkout', '--', 'hello.txt']);
    writeFileSync(join(feedDir, 'patches', 'bad.diff'), bad.replace('-hello', '-not what is there'), 'utf8');
    writeManifestReleases('2026.02.0', [
      { id: '2026.02.0', notes: [...codePatchNote('note-1', 'good.diff'), ...codePatchNote('note-2', 'bad.diff')] },
    ]);
    dirtyUnrelatedFile();
    untrackedUnrelatedFile();
    const start = git(repo, ['rev-parse', 'HEAD']).trim();

    const result = run();

    expect(result.status).toBe('blocked');
    expect(result.blocked?.id).toBe('note-2');
    // the run's own work is gone: note-1's commit and change, note-2's partial state
    expect(git(repo, ['rev-parse', 'HEAD']).trim()).toBe(start);
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('hello\n');
    expect(existsSync(join(repo, 'added.txt'))).toBe(false);
    // the user's work is exactly as it was, and still uncommitted
    expect(readFileSync(join(repo, 'docs', 'notes.md'), 'utf8')).toBe(NOTES + USER_EDIT);
    expect(status('docs/notes.md')).toBe('M docs/notes.md');
    expect(readFileSync(join(repo, 'docs', 'draft.md'), 'utf8')).toBe('not committed yet\n');
    expect(status('docs/draft.md')).toBe('?? docs/draft.md');
  });

  it('keeps the user’s edits when verification fails, and commits none of them on success', () => {
    writeFileSync(join(feedDir, 'patches', 'change.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    writeManifest('2026.02.0', '2026.02.0');
    dirtyUnrelatedFile();
    untrackedUnrelatedFile();
    const start = git(repo, ['rev-parse', 'HEAD']).trim();

    const failed = run({ verification: ['false'] });

    expect(failed.status).toBe('verification-failed');
    expect(git(repo, ['rev-parse', 'HEAD']).trim()).toBe(start);
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('hello\n');
    expect(readFileSync(join(repo, 'docs', 'notes.md'), 'utf8')).toBe(NOTES + USER_EDIT);
    expect(status('docs/draft.md')).toBe('?? docs/draft.md');

    // once the note is unheld, a passing run commits only the upgrade
    const log = readUpgradeLog(repo);
    delete log.upgrades['note-1'];
    writeUpgradeLog(repo, log);
    const passed = run();

    expect(passed.status).toBe('applied');
    expect(git(repo, ['show', '--name-only', '--format=', 'HEAD']).trim()).toBe('hello.txt');
    expect(status('docs/notes.md')).toBe('M docs/notes.md');
    expect(status('docs/draft.md')).toBe('?? docs/draft.md');
  });

  it('blocks a note whose patch touches a file with uncommitted changes, and leaves the file alone', () => {
    dirtyUnrelatedFile();
    // the patch edits line one; the user's uncommitted edit is at the end, so it would apply on top
    git(repo, ['stash', '-q']);
    writeFileSync(
      join(feedDir, 'patches', 'change.diff'),
      makeDiff('docs/notes.md', NOTES.replace('one', 'ONE')),
      'utf8',
    );
    git(repo, ['stash', 'pop', '-q']);
    writeManifest('2026.02.0', '2026.02.0');

    const result = run();

    expect(result.status).toBe('blocked');
    expect(result.blocked?.id).toBe('note-1');
    expect(result.blocked?.uncommitted).toEqual(['docs/notes.md']);
    expect(result.blocked?.reason).toContain('docs/notes.md has uncommitted changes');
    expect(result.blocked?.reason).toContain('commit or stash them first');
    expect(readFileSync(join(repo, 'docs', 'notes.md'), 'utf8')).toBe(NOTES + USER_EDIT);
    expect(status('docs/notes.md')).toBe('M docs/notes.md');
    // held back by the user's work, not by the upgrade: nothing recorded, so a later run retries it
    expect(readUpgradeLog(repo).upgrades['note-1']).toBeUndefined();
  });

  it('blocks a package bump whose manifest has uncommitted changes, before writing anything', () => {
    writeFileSync(join(repo, 'package.json'), `${JSON.stringify({ name: 'consumer', dependencies: {} }, null, 2)}\n`);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-q', '-m', 'add package.json']);
    const userManifest = `${JSON.stringify(
      { name: 'consumer', dependencies: { 'example-lib': '^1.0.0' } },
      null,
      2,
    )}\n`;
    writeFileSync(join(repo, 'package.json'), userManifest);
    writeManifestReleases('2026.02.0', [
      {
        id: '2026.02.0',
        notes: [
          '      - id: note-pkg',
          '        title: Bump example-lib',
          '        delivery: package-release',
          '        packageReleases:',
          '          - name: example-lib',
          '            targetVersion: 2.0.0',
        ],
      },
    ]);

    const result = run();

    expect(result.status).toBe('blocked');
    expect(result.blocked?.uncommitted).toEqual(['package.json']);
    expect(readFileSync(join(repo, 'package.json'), 'utf8')).toBe(userManifest);
  });
});

describe('applyRun on a clean tree', () => {
  it('still rolls back every change of a failed multi-note run', () => {
    writeFileSync(join(feedDir, 'patches', 'good.diff'), makeDiff('hello.txt', 'hello world\n'), 'utf8');
    writeFileSync(join(repo, 'added.txt'), 'new\n', 'utf8');
    git(repo, ['add', '-N', 'added.txt']);
    const create = git(repo, ['diff']);
    git(repo, ['reset', '-q']);
    rmSync(join(repo, 'added.txt'));
    writeFileSync(join(feedDir, 'patches', 'create.diff'), create, 'utf8');
    writeFileSync(
      join(feedDir, 'patches', 'bad.diff'),
      makeDiff('hello.txt', 'other\n').replace('-hello', '-nope'),
      'utf8',
    );
    writeManifestReleases('2026.02.0', [
      {
        id: '2026.02.0',
        notes: [
          '      - id: note-1',
          '        title: Change hello',
          '        delivery: code-patch',
          '        patch: patches/good.diff',
          '      - id: note-2',
          '        title: Add a file',
          '        delivery: code-patch',
          '        patch: patches/create.diff',
          '      - id: note-3',
          '        title: Will not apply',
          '        delivery: code-patch',
          '        patch: patches/bad.diff',
        ],
      },
    ]);
    const start = git(repo, ['rev-parse', 'HEAD']).trim();

    const result = applyRun(repo, { manifestFile: join(feedDir, 'manifest.yaml'), verification: [] });

    expect(result.status).toBe('blocked');
    expect(result.blocked?.id).toBe('note-3');
    expect(git(repo, ['rev-parse', 'HEAD']).trim()).toBe(start);
    expect(readFileSync(join(repo, 'hello.txt'), 'utf8')).toBe('hello\n');
    expect(existsSync(join(repo, 'added.txt'))).toBe(false);
    const dirty = git(repo, ['status', '--porcelain'])
      .split('\n')
      .filter((line) => line.trim() && !line.includes('.nestled/'));
    expect(dirty).toEqual([]);
  });
});
