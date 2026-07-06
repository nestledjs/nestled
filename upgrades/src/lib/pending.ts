import { compareReleaseId, Manifest, Release, UpgradeNote } from './manifest';
import { DEFAULT_CHANNEL, Outcome, TERMINAL_OUTCOMES, UpgradeLog } from './baseline';

export interface PendingNote extends UpgradeNote {
  releaseId: string;
  /** Prior recorded outcome, if this note was seen before (e.g. `blocked`). */
  status?: Outcome;
}

export interface PendingResult {
  channel: string;
  /** The channel pointer from the manifest (undefined if the channel is unknown). */
  ceiling?: string;
  /** The clone's current baseline release (undefined if never initialised). */
  baseline?: string;
  /** Releases in `(baseline, ceiling]`, ascending. */
  releases: Release[];
  /** Flattened notes from those releases that are not already terminal. */
  notes: PendingNote[];
}

/**
 * Compute what a clone still needs on its channel:
 *   pending = releases where baseline < id <= channels[channel]
 * A missing channel pointer means nothing has been published to that channel,
 * so nothing is pending (fail safe, never apply into the unknown).
 */
export function computePending(manifest: Manifest, log: UpgradeLog): PendingResult {
  const channel = log.template?.channel || DEFAULT_CHANNEL;
  const ceiling = manifest.channels?.[channel];
  const baseline = log.template?.baselineRelease;
  const applied = log.upgrades ?? {};

  if (!ceiling) {
    return { channel, ceiling: undefined, baseline, releases: [], notes: [] };
  }

  const releases = manifest.releases
    .filter((release) => {
      const aboveBaseline = !baseline || compareReleaseId(release.id, baseline) > 0;
      const withinCeiling = compareReleaseId(release.id, ceiling) <= 0;
      return aboveBaseline && withinCeiling;
    })
    .sort((a, b) => compareReleaseId(a.id, b.id));

  const notes: PendingNote[] = [];
  for (const release of releases) {
    for (const note of release.notes ?? []) {
      const status = applied[note.id];
      if (status && TERMINAL_OUTCOMES.has(status)) continue;
      notes.push({ ...note, releaseId: release.id, status });
    }
  }

  return { channel, ceiling, baseline, releases, notes };
}
