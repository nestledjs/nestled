import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyRun } from './apply';
import { initBaseline, readUpgradeLog } from './baseline';

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
});
