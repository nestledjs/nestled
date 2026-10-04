import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { commitPaths, dirtyPaths, patchPaths, RunChanges } from './changes';
import { compareReleaseId, Manifest, PackageRelease, UpgradeNote } from './manifest';
import {
  advanceBaseline,
  DEFAULT_CHANNEL,
  readSiteConfig,
  readUpgradeLog,
  setOutcome,
  SiteConfig,
  UpgradeLog,
  writeUpgradeLog,
} from './baseline';
import { computePending, PendingResult } from './pending';
import { resolveFeed, ResolveFeedOptions } from './feed';
import {
  checkoutBranch,
  commitAll,
  git,
  gitOutput,
  hasUncommittedChanges,
  isGitRepo,
  PrResult,
  pushAndCreatePR,
} from './git';

/** A patch must never touch our own bookkeeping. */
const PATCH_EXCLUDES = ['.nestled/**'];

export type RunStatus = 'up-to-date' | 'applied' | 'needs-review' | 'blocked' | 'verification-failed';

export interface AppliedNote {
  id: string;
  title: string;
  delivery: string;
  via3way?: boolean;
  alreadyApplied?: boolean;
  packageUpdated?: { manifest: string; name: string; version: string }[];
  /** Carried over from the note when present; a human/agent still owes this work. */
  review?: string;
}

export interface BlockedInfo {
  id: string;
  reason: string;
  output?: string;
  /**
   * Set when the note was held back only because it would touch these paths, which had uncommitted
   * changes when the run started. Nothing is wrong with the upgrade itself, so it is not recorded as
   * `blocked` in the ledger: commit or stash the paths and run again.
   */
  uncommitted?: string[];
}

export interface VerificationResult {
  command: string;
  status: number;
  output: string;
  error: string;
}

export interface ApplyRunResult {
  status: RunStatus;
  channel: string;
  branch?: string;
  applied: AppliedNote[];
  blocked?: BlockedInfo;
  verification?: VerificationResult[];
  baselineRelease?: string;
  pr?: PrResult;
}

export interface ApplyOptions extends ResolveFeedOptions {
  allowDirty?: boolean;
  autoPR?: boolean;
  verification?: string[];
  forkedAreas?: string[];
  defaultBranch?: string;
}

function includesPackage(note: UpgradeNote): boolean {
  return note.delivery === 'package-release' || note.delivery === 'hybrid';
}

function includesPatch(note: UpgradeNote): boolean {
  return !note.delivery || note.delivery === 'code-patch' || note.delivery === 'hybrid';
}

interface PatchAttempt {
  applied: boolean;
  alreadyApplied?: boolean;
  via3way?: boolean;
  output?: string;
}

/**
 * `undoPartial` puts back the patch's own paths after a failed 3-way attempt (which can leave conflict
 * markers and index entries behind); it must touch nothing else.
 */
function tryApplyPatch(cwd: string, diffText: string, undoPartial: () => void): PatchAttempt {
  const excludeArgs = PATCH_EXCLUDES.map((pattern) => `--exclude=${pattern}`);
  const dir = mkdtempSync(join(tmpdir(), 'nestled-upd-'));
  const file = join(dir, 'change.diff');
  writeFileSync(file, diffText, 'utf8');
  try {
    const check = git(cwd, ['apply', ...excludeArgs, '--check', file]);
    if (check.status !== 0) {
      const reverse = git(cwd, ['apply', ...excludeArgs, '--reverse', '--check', file]);
      if (reverse.status === 0) return { applied: false, alreadyApplied: true };
      const threeWay = git(cwd, ['apply', '--3way', ...excludeArgs, file]);
      if (threeWay.status === 0) return { applied: true, via3way: true };
      // 3-way may have left partial state, but only on this note's own paths.
      undoPartial();
      return { applied: false, output: check.stderr || check.stdout };
    }
    const apply = git(cwd, ['apply', ...excludeArgs, file]);
    return { applied: apply.status === 0, output: apply.stderr || apply.stdout };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

interface PackageApplyResult {
  status: 'applied' | 'blocked' | 'not-applicable';
  reason?: string;
  updated?: { manifest: string; name: string; version: string }[];
}

function safeReadPackageJson(filePath: string): Record<string, any> | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function walkPackageJson(dir: string, result: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walkPackageJson(absolute, result);
    else if (entry.name === 'package.json') result.push(absolute);
  }
}

function findPackageManifests(cwd: string, releases: PackageRelease[]): string[] {
  const explicit = releases.flatMap((release) => release.manifests ?? []);
  if (explicit.length) {
    return explicit.map((manifest) => join(cwd, manifest)).filter((manifest) => existsSync(manifest));
  }
  const result: string[] = [];
  walkPackageJson(cwd, result);
  return result;
}

function verifyPublishedPackage(name: string, version: string | undefined): boolean {
  if (!name || !version) return false;
  const result = spawnSync('npm', ['view', `${name}@${version}`, 'version', '--json'], { encoding: 'utf8' });
  return (result.status ?? 1) === 0 && (result.stdout ?? '').trim() !== '';
}

function packageManagerInstall(cwd: string): string[] | null {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return ['pnpm', 'install'];
  if (existsSync(join(cwd, 'yarn.lock'))) return ['yarn', 'install'];
  if (existsSync(join(cwd, 'package-lock.json'))) return ['npm', 'install'];
  return null;
}

function updateLockfile(cwd: string): { status: number; reason: string } {
  const command = packageManagerInstall(cwd);
  if (!command) return { status: 0, reason: 'No package manager lockfile detected.' };
  const result = spawnSync(command[0], command.slice(1), { cwd, encoding: 'utf8' });
  return {
    status: result.status ?? 1,
    reason: (result.status ?? 1) === 0 ? 'Lockfile updated.' : result.stderr || result.stdout || 'Install failed.',
  };
}

function lockfilePath(cwd: string): string | null {
  for (const name of ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json']) {
    if (existsSync(join(cwd, name))) return join(cwd, name);
  }
  return null;
}

interface PackagePlan {
  /** Absolute paths of the manifests the bump rewrites, with their new contents. */
  writes: { path: string; contents: string }[];
  updated: { manifest: string; name: string; version: string }[];
  /** The lockfile the install step rewrites (absolute), when there are manifests to change. */
  lockfile: string | null;
}

/** Work out what a package bump would write, without writing anything. */
function planPackageReleases(cwd: string, note: UpgradeNote): PackagePlan {
  const releases = note.packageReleases ?? [];
  const manifests = findPackageManifests(cwd, releases);
  const writes: PackagePlan['writes'] = [];
  const updated: PackagePlan['updated'] = [];
  for (const manifestPath of manifests) {
    const pkg = safeReadPackageJson(manifestPath);
    if (!pkg) continue;
    let changed = false;
    for (const release of releases) {
      const version = release.versionRange ?? release.targetVersion ?? '';
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        if (pkg[field]?.[release.name]) {
          pkg[field][release.name] = version;
          updated.push({ manifest: relative(cwd, manifestPath), name: release.name, version });
          changed = true;
        }
      }
    }
    if (changed) writes.push({ path: manifestPath, contents: `${JSON.stringify(pkg, null, 2)}\n` });
  }
  return { writes, updated, lockfile: writes.length ? lockfilePath(cwd) : null };
}

/** Absolute paths the package step of `note` would write: changed manifests and the lockfile. */
function packageTargets(plan: PackagePlan): string[] {
  return [...plan.writes.map((write) => write.path), ...(plan.lockfile ? [plan.lockfile] : [])];
}

function applyPackageReleases(cwd: string, note: UpgradeNote, plan: PackagePlan): PackageApplyResult {
  const releases = note.packageReleases ?? [];
  if (releases.some((release) => !release.targetVersion && !release.versionRange)) {
    return { status: 'blocked', reason: 'Package release is missing targetVersion and versionRange (pending release).' };
  }
  for (const release of releases) {
    const version = release.targetVersion ?? release.versionRange;
    if (!verifyPublishedPackage(release.name, version)) {
      return { status: 'blocked', reason: `Cannot verify published version for ${release.name}@${version}.` };
    }
  }
  const { updated } = plan;
  for (const write of plan.writes) writeFileSync(write.path, write.contents);
  if (updated.length === 0) {
    const names = releases.map((r) => r.name).join(', ') || 'the referenced packages';
    return { status: 'not-applicable', reason: `Project does not consume ${names}.` };
  }
  const lockfile = updateLockfile(cwd);
  return { status: lockfile.status === 0 ? 'applied' : 'blocked', reason: lockfile.reason, updated };
}

function detectPackageManager(cwd: string): string {
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm';
  return 'pnpm';
}

function inferVerification(cwd: string): string[] {
  const pkg = safeReadPackageJson(join(cwd, 'package.json'));
  if (!pkg) return [];
  const pm = detectPackageManager(cwd);
  const scripts = pkg.scripts ?? {};
  const commands: string[] = [];
  if (scripts.lint) commands.push(`${pm} lint`);
  if (scripts.test) commands.push(`${pm} test`);
  return commands;
}

function runVerification(cwd: string, commands: string[]): VerificationResult[] {
  return commands.map((command) => {
    const result = spawnSync(command, { cwd, shell: true, encoding: 'utf8' });
    return { command, status: result.status ?? 1, output: result.stdout ?? '', error: result.stderr ?? '' };
  });
}

function releasesForBaseline(manifest: Manifest, pending: PendingResult) {
  return manifest.releases
    .filter((release) => {
      const aboveBaseline = !pending.baseline || compareReleaseId(release.id, pending.baseline) > 0;
      const withinCeiling = !pending.ceiling || compareReleaseId(release.id, pending.ceiling) <= 0;
      return aboveBaseline && withinCeiling;
    })
    .sort((a, b) => compareReleaseId(a.id, b.id))
    .map((release) => ({
      id: release.id,
      templateCommit: release.templateCommit,
      noteIds: (release.notes ?? []).map((note) => note.id),
    }));
}

function prBody(applied: AppliedNote[], channel: string, ceiling?: string): string {
  const clean = applied.filter((note) => !note.review);
  const needsReview = applied.filter((note) => note.review);
  const lines = clean.map((note) => `- ${note.id} — ${note.title}`);
  const reviewSection = needsReview.length
    ? [
        '',
        '## ⚠️ Needs review before merging',
        '',
        ...needsReview.flatMap((note) => [`- **${note.id}** — ${note.title}`, '', `  ${note.review}`, '']),
      ]
    : [];
  return [
    '## Nestled upgrades',
    '',
    `Channel: ${channel}${ceiling ? ` (up to ${ceiling})` : ''}`,
    '',
    ...lines,
    ...reviewSection,
    '',
    '🤖 Applied by nestled-update',
  ].join('\n');
}

/**
 * Apply every pending upgrade for this clone's channel, all-or-nothing per run:
 * notes are applied and committed one at a time onto a dedicated branch; the
 * first note that cannot be applied cleanly, or a failing verification run,
 * rolls the branch back to where it started and records the blocker for manual
 * adaptation. On success, per-note outcomes are recorded and the baseline is
 * advanced across every fully-completed release.
 */
export function applyRun(projectDir: string, options: ApplyOptions = {}): ApplyRunResult {
  const config: SiteConfig = readSiteConfig(projectDir);
  const log: UpgradeLog = readUpgradeLog(projectDir);
  log.upgrades ??= {};
  const channel = log.template.channel || DEFAULT_CHANNEL;

  const feed = resolveFeed(projectDir, log, options);
  const pending = computePending(feed.manifest, log);
  if (pending.notes.length === 0) {
    // Nothing left to apply, but releases whose notes were all recorded terminal by hand (adapted,
    // skipped, ...) still need the baseline carried past them.
    // Only within a published channel: with no ceiling, nothing may advance (fail safe).
    if (pending.ceiling) {
      const previousBaseline = log.template.baselineRelease;
      advanceBaseline(log, releasesForBaseline(feed.manifest, pending));
      if (log.template.baselineRelease !== previousBaseline) writeUpgradeLog(projectDir, log);
    }
    return { status: 'up-to-date', channel, applied: [], baselineRelease: log.template.baselineRelease };
  }

  // A note already recorded as blocked waits for a person: it was tried, or deliberately held, and
  // re-attempting it unattended would redo exactly what was refused. Stop before creating a branch or
  // touching the working tree (the feed itself has already been read, which may have fetched); the
  // ledger entry is resolved by hand-editing it to a terminal outcome, as with `needs-review`.
  const held = pending.notes.find((note) => note.status === 'blocked');
  if (held && held === pending.notes[0]) {
    return {
      status: 'blocked',
      channel,
      applied: [],
      blocked: { id: held.id, reason: 'Recorded as blocked; resolve it by hand, then record a terminal outcome.' },
      baselineRelease: log.template.baselineRelease,
    };
  }

  if (!isGitRepo(projectDir)) {
    throw new Error('Project is not a git repository; cannot create an upgrade branch.');
  }
  const startedClean = !hasUncommittedChanges(projectDir);
  if (!startedClean && !options.allowDirty) {
    throw new Error('Project has uncommitted changes. Commit them, or re-run with --allow-dirty.');
  }

  const branch = `nestled-update/${channel}-${pending.ceiling}`;
  checkoutBranch(projectDir, branch);
  const startCommit = gitOutput(projectDir, ['rev-parse', 'HEAD']);
  const forked = new Set(options.forkedAreas ?? config.forkedAreas ?? []);

  // Everything below works in repository-root-relative paths, the form `git status` reports.
  const root = gitOutput(projectDir, ['rev-parse', '--show-toplevel']) || projectDir;
  const prefix = gitOutput(projectDir, ['rev-parse', '--show-prefix']);
  const fromProject = (path: string) => `${prefix}${path}`.split('\\').join('/');
  const fromAbsolute = (path: string) => fromProject(relative(projectDir, path));
  // What the user had uncommitted when we started is theirs: no note may write it, no rollback may revert it.
  const dirtyAtStart = startedClean ? new Set<string>() : dirtyPaths(root);
  const changes = new RunChanges(root, startCommit);
  const uncommittedBlock = (id: string, paths: string[]): BlockedInfo | null => {
    const overlap = paths.filter((path) => dirtyAtStart.has(path));
    if (!overlap.length) return null;
    const subject = `${overlap.join(', ')} ${overlap.length === 1 ? 'has' : 'have'}`;
    const reason = `${subject} uncommitted changes this upgrade would overwrite; commit or stash them first, then re-run.`;
    return { id, reason, uncommitted: overlap };
  };

  /**
   * Undo the run: drop its commits and put back exactly the paths it touched. Every other file,
   * including everything uncommitted at the start of an `--allow-dirty` run, is left as it is.
   */
  const rollback = () => {
    if (startedClean && startCommit) {
      // The tree was clean (outside `.nestled/`) when we started, so nothing here is anyone else's work.
      git(projectDir, ['reset', '--hard', startCommit]);
    } else if (startCommit) {
      // Keep the index and working tree: they hold the user's uncommitted changes as well as ours.
      git(root, ['reset', '--soft', startCommit]);
    }
    changes.restore();
  };

  const applied: { note: UpgradeNote; entry: AppliedNote }[] = [];
  let blocked: BlockedInfo | null = null;
  /**
   * Set to the releaseId of the first note carrying `review`. Baseline must not advance past
   * this release — see the comment on `advanceBaseline` below — so later notes, even ones that
   * would apply cleanly, are left pending rather than climbing past unreviewed work.
   */
  let reviewReleaseId: string | null = null;

  for (const note of pending.notes) {
    if (note.status === 'blocked') {
      blocked = { id: note.id, reason: 'Recorded as blocked; resolve it by hand, then record a terminal outcome.' };
      break;
    }
    if (note.area && forked.has(note.area)) {
      blocked = { id: note.id, reason: `Area "${note.area}" is marked forked; review intent before applying.` };
      break;
    }
    const entry: AppliedNote = { id: note.id, title: note.title, delivery: note.delivery };
    const noteTouched = new Set<string>();

    if (includesPackage(note)) {
      const plan = planPackageReleases(projectDir, note);
      const targets = packageTargets(plan).map(fromAbsolute);
      blocked = uncommittedBlock(note.id, targets);
      if (blocked) break;
      changes.willTouch(targets);
      targets.forEach((path) => noteTouched.add(path));
      // The install may write more than the lockfile; anything it newly dirties is ours too.
      const dirtyBefore = dirtyPaths(root);
      const result = applyPackageReleases(projectDir, note, plan);
      const sideEffects = [...dirtyPaths(root)].filter((path) => !dirtyBefore.has(path));
      changes.didChange(sideEffects);
      sideEffects.forEach((path) => noteTouched.add(path));
      if (result.status === 'blocked') {
        blocked = { id: note.id, reason: result.reason ?? 'Package release blocked.' };
        break;
      }
      if (result.status === 'not-applicable' && !includesPatch(note)) {
        setOutcome(log, note.id, 'not-applicable');
        continue;
      }
      entry.packageUpdated = result.updated;
    }

    if (includesPatch(note)) {
      if (!note.patch) {
        blocked = { id: note.id, reason: 'Note declares a code patch but has no patch reference.' };
        break;
      }
      const diff = feed.readPatch(note.patch);
      if (diff == null) {
        blocked = { id: note.id, reason: `Patch not found in feed: ${note.patch}` };
        break;
      }
      const paths = patchPaths(diff, PATCH_EXCLUDES).map(fromProject);
      blocked = uncommittedBlock(note.id, paths);
      if (blocked) break;
      changes.willTouch(paths);
      paths.forEach((path) => noteTouched.add(path));
      const patch = tryApplyPatch(projectDir, diff, () => changes.restore(paths));
      if (!patch.applied && !patch.alreadyApplied) {
        blocked = {
          id: note.id,
          reason: 'Patch did not apply cleanly; intent-based adaptation required.',
          output: patch.output,
        };
        break;
      }
      entry.via3way = patch.via3way;
      entry.alreadyApplied = patch.alreadyApplied;
    }

    if (note.review) entry.review = note.review;

    // On a dirty tree, commit only what this note changed: the user's own edits stay uncommitted.
    const message = `Apply Nestled upgrade ${note.id}`;
    if (startedClean) commitAll(projectDir, message);
    else commitPaths(root, message, [...noteTouched]);
    applied.push({ note, entry });

    // A note with no mechanical component at all (pure `intent-only`) still reaches here with
    // nothing to commit beyond a no-op; committing is a no-op when nothing changed. Either way,
    // stop climbing the release ladder here: later notes may build on the judgment call this one
    // is waiting on, so they stay pending rather than applying past it.
    if (entry.review) {
      reviewReleaseId = note.releaseId;
      break;
    }
  }

  if (blocked) {
    rollback();
    // Held back only by the user's uncommitted work: not a problem with the upgrade, so not recorded.
    if (!blocked.uncommitted) setOutcome(log, blocked.id, 'blocked');
    writeUpgradeLog(projectDir, log);
    return { status: 'blocked', channel, branch, applied: [], blocked, baselineRelease: log.template.baselineRelease };
  }

  // A note's own `verification` takes precedence over the consumer's auto-detected lint/test
  // scripts: the full suite may need infrastructure (a database, Docker) an unattended rollout
  // can't assume is running, and would catch unrelated pre-existing failures rather than this
  // specific change. An explicit --verify still wins, for an operator forcing an ad-hoc check.
  const noteVerification = [...new Set(applied.flatMap(({ note }) => note.verification ?? []))];
  const commands =
    options.verification ?? (noteVerification.length ? noteVerification : config.verification ?? inferVerification(projectDir));
  const verification = applied.length ? runVerification(projectDir, commands) : [];
  const failed = verification.find((item) => item.status !== 0);
  if (failed) {
    rollback();
    for (const { note } of applied) setOutcome(log, note.id, 'blocked');
    writeUpgradeLog(projectDir, log);
    return {
      status: 'verification-failed',
      channel,
      branch,
      applied: [],
      verification,
      blocked: { id: failed.command, reason: `Verification failed: ${failed.command}` },
      baselineRelease: log.template.baselineRelease,
    };
  }

  for (const { note, entry } of applied) {
    setOutcome(log, note.id, entry.review ? 'needs-review' : entry.alreadyApplied ? 'superseded' : 'applied');
  }
  // Hold the baseline just below reviewReleaseId, not just below `pending.ceiling`: computePending
  // stops re-offering a release once the baseline passes it, terminal-note-status or not (see
  // pending.ts). Advancing past an unreviewed note would make `review` unrecoverable — the only
  // durable record left would be the ledger's bare `needs-review` string. Held back, `check` keeps
  // re-fetching and re-printing the note's `review` text on every run until someone resolves it by
  // hand-editing this entry to a terminal outcome, the same way `blocked` already works.
  const eligibleReleases = releasesForBaseline(feed.manifest, pending).filter(
    (release) => !reviewReleaseId || compareReleaseId(release.id, reviewReleaseId) < 0,
  );
  advanceBaseline(log, eligibleReleases);
  writeUpgradeLog(projectDir, log);

  let pr: PrResult | undefined;
  if ((options.autoPR ?? config.autoPR) && applied.length) {
    pr = pushAndCreatePR(projectDir, {
      branch,
      base: options.defaultBranch ?? config.defaultBranch ?? 'develop',
      title: `Nestled upgrades up to ${pending.ceiling}`,
      body: prBody(applied.map((a) => a.entry), channel, pending.ceiling),
    });
  }

  return {
    status: reviewReleaseId ? 'needs-review' : 'applied',
    channel,
    branch,
    applied: applied.map((a) => a.entry),
    verification,
    baselineRelease: log.template.baselineRelease,
    pr,
  };
}
