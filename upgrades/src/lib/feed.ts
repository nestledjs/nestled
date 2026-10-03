import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { loadManifestFromFile, Manifest, parseManifest } from './manifest';
import { ensureRemote, fetchRef, showFile } from './git';
import { UpgradeLog } from './baseline';

/** Where the feed lives inside the template repo. */
export const FEED_DIR = '.nestled-upgrades';
export const MANIFEST_PATH = `${FEED_DIR}/manifest.yaml`;
export const UPSTREAM_REMOTE = 'nestled-upstream';

/**
 * A resolved feed: the parsed manifest plus a way to read a patch file the
 * notes reference. `readPatch` takes the note's `patch` value (a path relative
 * to the feed dir, or a full repo path) and returns the diff text.
 */
export interface ResolvedFeed {
  manifest: Manifest;
  source: string;
  readPatch(patchRef: string): string | null;
}

export interface ResolveFeedOptions {
  /** Local manifest file (dev/testing/offline); bypasses git fetch. */
  manifestFile?: string;
  /** Override the template git URL (else taken from the log). */
  remote?: string;
  /** Override the feed ref (else taken from the log, default `develop`). */
  ref?: string;
}

function normalizePatchRef(patchRef: string): string {
  if (patchRef.startsWith(`${FEED_DIR}/`)) return patchRef;
  return `${FEED_DIR}/${patchRef.replace(/^\.?\/*/, '')}`;
}

/**
 * Resolve the feed from a local manifest file: patches are read from
 * `<manifest dir>/patches/...` (or a path relative to the manifest's dir).
 */
function resolveLocalFeed(manifestFile: string): ResolvedFeed {
  const manifest = loadManifestFromFile(manifestFile);
  const baseDir = dirname(manifestFile);
  return {
    manifest,
    source: manifestFile,
    readPatch(patchRef: string): string | null {
      const rel = patchRef.startsWith(`${FEED_DIR}/`)
        ? patchRef.slice(FEED_DIR.length + 1)
        : patchRef.replace(/^\.?\/*/, '');
      const candidate = isAbsolute(patchRef) ? patchRef : join(baseDir, rel);
      return existsSync(candidate) ? readFileSync(candidate, 'utf8') : null;
    },
  };
}

/**
 * Resolve the feed from the template git repo: ensure the upstream remote,
 * fetch the feed ref, then read the manifest and patches via `git show` at that
 * ref — no working checkout of the template needed.
 */
function resolveGitFeed(projectDir: string, remote: string, ref: string): ResolvedFeed {
  ensureRemote(projectDir, UPSTREAM_REMOTE, remote);
  const fetched = fetchRef(projectDir, UPSTREAM_REMOTE, ref, { filterBlobless: true });
  if (fetched.status !== 0) {
    throw new Error(`Failed to fetch feed ref "${ref}" from ${remote}: ${fetched.stderr || fetched.stdout}`);
  }
  const rev = `${UPSTREAM_REMOTE}/${ref}`;
  const manifestText = showFile(projectDir, rev, MANIFEST_PATH);
  if (manifestText == null) {
    throw new Error(`No ${MANIFEST_PATH} found at ${rev}. Has a release been published to this channel yet?`);
  }
  const manifest = parseManifest(manifestText);
  return {
    manifest,
    source: `${remote}@${ref}`,
    readPatch(patchRef: string): string | null {
      return showFile(projectDir, rev, normalizePatchRef(patchRef));
    },
  };
}

export function resolveFeed(
  projectDir: string,
  log: UpgradeLog,
  options: ResolveFeedOptions = {},
): ResolvedFeed {
  if (options.manifestFile) {
    return resolveLocalFeed(options.manifestFile);
  }
  const remote = options.remote ?? log.template?.remote;
  const ref = options.ref ?? log.template?.ref ?? 'develop';
  if (!remote) {
    throw new Error(
      'No template remote configured. Run `nestled-update init --remote <git-url>`, ' +
        'set template.remote in .nestled/config.yaml, or pass --manifest <file> for local testing.',
    );
  }
  return resolveGitFeed(projectDir, remote, ref);
}
