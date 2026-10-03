import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advanceBaseline,
  isTerminal,
  outcomeOf,
  readUpgradeLog,
  setOutcome,
  UpgradeLog,
  writeUpgradeLog,
} from './baseline';
import { computePending } from './pending';
import { Manifest } from './manifest';
import { run } from './cli';

// A ledger the way projects actually write it: record entries with a status and notes, bare-string
// entries, quoted timestamps and long single-line notes.
const LEDGER = `template:
  channel: canary
  baselineRelease: 2026.09.1
  remote: "https://example.com/nestled-template.git"
  ref: develop
  lastReviewedCommit: aaaaaaa
upgrades:
  note-adapted:
    status: adapted
    reviewedAt: "2026-10-01T12:00:00.000Z"
    notes: "Adapted by hand to this project's diverged service; a long single-line note that must not be re-wrapped when the file is written back."
  note-blocked:
    status: blocked
    notes: "Waiting on a dependency."
  note-plain: applied
`;

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nestled-ledger-'));
  mkdirSync(join(dir, '.nestled'));
  writeFileSync(join(dir, '.nestled', 'upgrade-log.yaml'), LEDGER);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('ledger entries', () => {
  it('reads the outcome of record and bare-string entries', () => {
    const log = readUpgradeLog(dir);
    expect(outcomeOf(log.upgrades['note-adapted'])).toBe('adapted');
    expect(outcomeOf(log.upgrades['note-blocked'])).toBe('blocked');
    expect(outcomeOf(log.upgrades['note-plain'])).toBe('applied');
    expect(outcomeOf(undefined)).toBeUndefined();
  });

  it('treats adapted and skipped as terminal, blocked as not', () => {
    expect(isTerminal({ status: 'adapted' })).toBe(true);
    expect(isTerminal('skipped')).toBe(true);
    expect(isTerminal({ status: 'blocked' })).toBe(false);
    expect(isTerminal({ notes: 'no status' })).toBe(false);
  });

  it('does not re-offer notes recorded as record entries', () => {
    const manifest: Manifest = {
      schemaVersion: 1,
      channels: { canary: '2026.10.1' },
      releases: [
        {
          id: '2026.10.1',
          notes: [
            { id: 'note-adapted', title: 'A', delivery: 'code-patch', intent: '' },
            { id: 'note-blocked', title: 'B', delivery: 'code-patch', intent: '' },
            { id: 'note-plain', title: 'C', delivery: 'code-patch', intent: '' },
          ],
        },
      ],
    };
    const pending = computePending(manifest, readUpgradeLog(dir));
    expect(pending.notes.map((note) => [note.id, note.status])).toEqual([['note-blocked', 'blocked']]);
  });

  it('advances the baseline across a release whose notes were adapted', () => {
    const log: UpgradeLog = { template: { baselineRelease: '2026.09.1' }, upgrades: { x: { status: 'adapted' } } };
    advanceBaseline(log, [{ id: '2026.10.1', templateCommit: 'bbbbbbb', noteIds: ['x'] }]);
    expect(log.template.baselineRelease).toBe('2026.10.1');
    expect(log.template.lastReviewedCommit).toBe('bbbbbbb');
  });

  it('setOutcome keeps the other fields of a record entry', () => {
    const log = readUpgradeLog(dir);
    setOutcome(log, 'note-blocked', 'applied');
    setOutcome(log, 'new-note', 'superseded');
    expect(log.upgrades['note-blocked']).toEqual({ status: 'applied', notes: 'Waiting on a dependency.' });
    expect(log.upgrades['new-note']).toBe('superseded');
  });
});

describe('writeUpgradeLog', () => {
  it('rewrites an untouched ledger byte for byte', () => {
    writeUpgradeLog(dir, readUpgradeLog(dir));
    expect(readFileSync(join(dir, '.nestled', 'upgrade-log.yaml'), 'utf8')).toBe(LEDGER);
  });

  it('changes only what changed, keeping quoting and long lines', () => {
    const log = readUpgradeLog(dir);
    setOutcome(log, 'note-blocked', 'applied');
    log.template.baselineRelease = '2026.10.1';
    writeUpgradeLog(dir, log);
    const written = readFileSync(join(dir, '.nestled', 'upgrade-log.yaml'), 'utf8');
    expect(written).toBe(
      LEDGER.replace('baselineRelease: 2026.09.1', 'baselineRelease: 2026.10.1').replace(
        'status: blocked',
        'status: applied',
      ),
    );
  });
});

describe('writeUpgradeLog record fields', () => {
  it('persists changes to any field of a record entry, and removals', () => {
    const log = readUpgradeLog(dir);
    const entry = log.upgrades['note-blocked'] as Record<string, unknown>;
    entry.notes = 'Unblocked after the dependency shipped.';
    entry.branch = 'upgrade/note-blocked';
    delete (log.upgrades['note-adapted'] as Record<string, unknown>).reviewedAt;
    writeUpgradeLog(dir, log);
    const reread = readUpgradeLog(dir);
    expect(reread.upgrades['note-blocked']).toEqual({
      status: 'blocked',
      notes: 'Unblocked after the dependency shipped.',
      branch: 'upgrade/note-blocked',
    });
    expect(reread.upgrades['note-adapted']).not.toHaveProperty('reviewedAt');
    // Untouched entries keep their exact text.
    expect(readFileSync(join(dir, '.nestled', 'upgrade-log.yaml'), 'utf8')).toContain(
      'notes: "Adapted by hand to this project\'s diverged service; a long single-line note that must not be re-wrapped when the file is written back."',
    );
  });
});

describe('writeUpgradeLog removals', () => {
  it('removes deleted template keys and deleted ledger entries', () => {
    const log = readUpgradeLog(dir);
    delete log.template.ref;
    delete log.upgrades['note-plain'];
    writeUpgradeLog(dir, log);
    const reread = readUpgradeLog(dir);
    expect(reread.template).not.toHaveProperty('ref');
    expect(reread.upgrades).not.toHaveProperty('note-plain');
    expect(reread.upgrades).toHaveProperty('note-adapted');
  });
});

describe('cli', () => {
  it('prints help for <command> --help instead of running the command', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const before = readFileSync(join(dir, '.nestled', 'upgrade-log.yaml'), 'utf8');
    expect(run(['init', '--help', '--project', dir])).toBe(0);
    expect(readFileSync(join(dir, '.nestled', 'upgrade-log.yaml'), 'utf8')).toBe(before);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('nestled-update');
    logSpy.mockRestore();
  });
});
