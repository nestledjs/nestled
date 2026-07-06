import { describe, expect, it } from 'vitest';
import { compareReleaseId, Manifest } from './manifest';
import { computePending } from './pending';
import { UpgradeLog } from './baseline';

function manifest(): Manifest {
  return {
    schemaVersion: 1,
    channels: { canary: '2026.07.10', stable: '2026.06.3' },
    releases: [
      { id: '2026.06.3', notes: [{ id: 'n-a', title: 'A', delivery: 'code-patch', intent: '' }] },
      { id: '2026.07.2', notes: [{ id: 'n-b', title: 'B', delivery: 'code-patch', intent: '' }] },
      { id: '2026.07.10', notes: [{ id: 'n-c', title: 'C', delivery: 'code-patch', intent: '' }] },
    ],
  };
}

function log(overrides: Partial<UpgradeLog['template']> = {}, upgrades: UpgradeLog['upgrades'] = {}): UpgradeLog {
  return { template: { channel: 'stable', baselineRelease: '2026.06.3', ...overrides }, upgrades };
}

describe('compareReleaseId', () => {
  it('orders by numeric segments, not lexically', () => {
    expect(compareReleaseId('2026.07.2', '2026.07.10')).toBe(-1);
    expect(compareReleaseId('2026.07.10', '2026.07.2')).toBe(1);
    expect(compareReleaseId('2026.07.1', '2026.07.1')).toBe(0);
  });

  it('treats missing trailing segments as zero', () => {
    expect(compareReleaseId('2026.07', '2026.07.0')).toBe(0);
    expect(compareReleaseId('2026.07', '2026.07.1')).toBe(-1);
  });
});

describe('computePending', () => {
  it('stops at the channel ceiling (stable sees less than canary)', () => {
    const result = computePending(manifest(), log({ baselineRelease: undefined }));
    // stable ceiling is 2026.06.3, so only that release is in-window
    expect(result.releases.map((r) => r.id)).toEqual(['2026.06.3']);
    expect(result.notes.map((n) => n.id)).toEqual(['n-a']);
  });

  it('canary reaches the newest release and sorts numerically', () => {
    const result = computePending(manifest(), log({ channel: 'canary', baselineRelease: '2026.06.3' }));
    expect(result.releases.map((r) => r.id)).toEqual(['2026.07.2', '2026.07.10']);
    expect(result.notes.map((n) => n.id)).toEqual(['n-b', 'n-c']);
  });

  it('excludes releases at or below the baseline', () => {
    const result = computePending(manifest(), log({ channel: 'canary', baselineRelease: '2026.07.2' }));
    expect(result.releases.map((r) => r.id)).toEqual(['2026.07.10']);
  });

  it('skips notes with terminal outcomes but keeps blocked ones', () => {
    const applied = computePending(manifest(), log({ channel: 'canary' }, { 'n-b': 'applied', 'n-c': 'blocked' }));
    expect(applied.notes.map((n) => n.id)).toEqual(['n-c']);
    expect(applied.notes[0].status).toBe('blocked');
  });

  it('returns nothing for an unknown channel (fail safe)', () => {
    const result = computePending(manifest(), log({ channel: 'experimental', baselineRelease: undefined }));
    expect(result.ceiling).toBeUndefined();
    expect(result.releases).toEqual([]);
    expect(result.notes).toEqual([]);
  });
});
