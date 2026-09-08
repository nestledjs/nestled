import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
});
