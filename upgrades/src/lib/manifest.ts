import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * The published upgrade feed. A single manifest lists every release in order,
 * plus a pointer per channel naming the newest release that channel should
 * have. A consumer on channel C applies every release with
 * `baseline < release.id <= channels[C]`.
 *
 * See docs/DISTRIBUTION-SPEC.md in the nestled-upgrader repo for the full model.
 */

export type DeliveryType = 'code-patch' | 'package-release' | 'hybrid';

export interface PackageRelease {
  name: string;
  /** Target version to install; absent (with no versionRange) means pending. */
  targetVersion?: string;
  versionRange?: string;
  /** Optional explicit manifest paths (relative to the project) to update. */
  manifests?: string[];
}

export interface UpgradeNote {
  id: string;
  title: string;
  delivery: DeliveryType;
  /** Human/agent-facing description of the change to make. */
  intent: string;
  /** Coarse subsystem tag (auth, billing, database, …) for forked-area gating. */
  area?: string;
  /** Hints only — not an authoritative file list. */
  affectedPaths?: string[];
  /** Repo path of the `.diff` within the template feed, for `code-patch`/`hybrid`. */
  patch?: string;
  /** For `package-release` and `hybrid`. */
  packageReleases?: PackageRelease[];
}

export interface Release {
  /** Sortable id, date-based recommended, e.g. "2026.07.1". */
  id: string;
  date?: string;
  title?: string;
  /** nestled-template commit this release corresponds to. */
  templateCommit?: string;
  notes: UpgradeNote[];
}

export interface Manifest {
  schemaVersion: number;
  generatedAt?: string;
  /** channel name -> newest release id that channel should have. */
  channels: Record<string, string>;
  releases: Release[];
}

export const SUPPORTED_SCHEMA_VERSION = 1;

export function parseManifest(text: string): Manifest {
  const raw = parse(text) as Partial<Manifest> | null;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Manifest is empty or not an object.');
  }
  if (raw.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported manifest schemaVersion ${String(raw.schemaVersion)} (expected ${SUPPORTED_SCHEMA_VERSION}).`,
    );
  }
  if (!raw.channels || typeof raw.channels !== 'object') {
    throw new Error('Manifest is missing a `channels` map.');
  }
  if (!Array.isArray(raw.releases)) {
    throw new Error('Manifest is missing a `releases` array.');
  }
  for (const release of raw.releases) {
    if (!release || typeof release.id !== 'string') {
      throw new Error('Every release must have a string `id`.');
    }
    if (release.notes != null && !Array.isArray(release.notes)) {
      throw new Error(`Release ${release.id} has a non-array \`notes\`.`);
    }
    release.notes = release.notes ?? [];
  }
  return raw as Manifest;
}

export function loadManifestFromFile(filePath: string): Manifest {
  return parseManifest(readFileSync(filePath, 'utf8'));
}

/**
 * Compare two release ids by numeric segments so that "2026.07.10" sorts after
 * "2026.07.2" (plain string compare would get that wrong). Non-digit runs are
 * treated as separators. Returns -1, 0, or 1.
 */
export function compareReleaseId(a: string, b: string): number {
  const segsA = a.split(/[^0-9]+/).filter(Boolean).map(Number);
  const segsB = b.split(/[^0-9]+/).filter(Boolean).map(Number);
  const len = Math.max(segsA.length, segsB.length);
  for (let i = 0; i < len; i++) {
    const x = segsA[i] ?? 0;
    const y = segsB[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
