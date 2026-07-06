import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';

/**
 * Per-clone state, stored at `<project>/.nestled/upgrade-log.yaml`. This is the
 * same file (and the same `template.originCommit` / `lastReviewedCommit` fields)
 * the private fleet upgrader already writes — we add `channel` and
 * `baselineRelease` so a standalone clone can compute what it still needs.
 */

export type Outcome =
  | 'applied'
  | 'blocked'
  | 'superseded'
  | 'not-applicable'
  | 'pending-release';

/** Outcomes that mean a note should not be offered again. */
export const TERMINAL_OUTCOMES: ReadonlySet<Outcome> = new Set<Outcome>([
  'applied',
  'superseded',
  'not-applicable',
]);

export interface TemplateState {
  repo?: string;
  /** Which channel this clone follows. Defaults to `stable`. */
  channel?: string;
  /** Newest release considered already-present in this clone. */
  baselineRelease?: string;
  /** Git URL of the template feed source. */
  remote?: string;
  /** Branch/ref on the template that carries the feed. */
  ref?: string;
  originCommit?: string;
  lastReviewedCommit?: string;
}

export interface UpgradeLog {
  template: TemplateState;
  upgrades: Record<string, Outcome>;
}

export const DEFAULT_CHANNEL = 'stable';

/** Version stamp committed into the template, carried by every clone. */
export interface TemplateVersionStamp {
  release: string;
  commit?: string;
  repo?: string;
  remote?: string;
  ref?: string;
}

/**
 * Optional per-site settings at `<project>/.nestled/config.yaml`. Everything is
 * optional; sensible defaults apply when the file (or a field) is absent.
 */
export interface SiteConfig {
  /** Verification commands to run after applying; inferred if omitted. */
  verification?: string[];
  /** Subsystem tags this clone has forked; matching notes are held for review. */
  forkedAreas?: string[];
  /** Push the upgrade branch and open a PR after a successful apply. */
  autoPR?: boolean;
  /** Base branch for the PR (default: the current branch's tracking base). */
  defaultBranch?: string;
  template?: { remote?: string; ref?: string };
}

export function readSiteConfig(projectDir: string): SiteConfig {
  const file = join(nestledDir(projectDir), 'config.yaml');
  if (!existsSync(file)) return {};
  return (parse(readFileSync(file, 'utf8')) as SiteConfig) ?? {};
}

export function nestledDir(projectDir: string): string {
  return join(projectDir, '.nestled');
}

export function logPathFor(projectDir: string): string {
  return join(nestledDir(projectDir), 'upgrade-log.yaml');
}

export function readUpgradeLog(projectDir: string): UpgradeLog {
  const file = logPathFor(projectDir);
  if (!existsSync(file)) {
    return { template: {}, upgrades: {} };
  }
  const raw = (parse(readFileSync(file, 'utf8')) as Partial<UpgradeLog>) ?? {};
  return {
    template: raw.template ?? {},
    upgrades: raw.upgrades ?? {},
  };
}

export function writeUpgradeLog(projectDir: string, log: UpgradeLog): void {
  const file = logPathFor(projectDir);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, stringify(log), 'utf8');
}

/**
 * Read the version stamp that travelled with the clone. Tolerates a couple of
 * filename spellings so producers aren't locked into one. Returns null if the
 * clone predates the stamp (legacy adoption — caller must supply a baseline).
 */
export function readTemplateStamp(projectDir: string): TemplateVersionStamp | null {
  const candidates = [
    join(nestledDir(projectDir), 'template-version'),
    join(nestledDir(projectDir), 'template-version.yaml'),
    join(nestledDir(projectDir), 'template-version.json'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const raw = parse(readFileSync(file, 'utf8')) as Partial<TemplateVersionStamp> | null;
    if (raw && typeof raw.release === 'string') {
      return { release: raw.release, commit: raw.commit, repo: raw.repo };
    }
  }
  return null;
}

export interface InitBaselineOptions {
  /** Explicit baseline release id; overrides the clone's stamp. */
  at?: string;
  channel?: string;
  repo?: string;
  commit?: string;
  /** Git URL of the template feed source. */
  remote?: string;
  /** Feed branch/ref on the template. */
  ref?: string;
}

/**
 * Establish (or re-affirm) the baseline for a clone. Precedence for the
 * baseline release: explicit `--at` > existing log > committed template stamp.
 * Idempotent: re-running never lowers an existing baseline or loses history.
 */
export function initBaseline(projectDir: string, options: InitBaselineOptions = {}): UpgradeLog {
  const log = readUpgradeLog(projectDir);
  const stamp = readTemplateStamp(projectDir);

  const baselineRelease =
    options.at ?? log.template.baselineRelease ?? stamp?.release;
  if (!baselineRelease) {
    throw new Error(
      'Cannot determine a baseline. Pass --at <release>, or add a committed ' +
        '.nestled/template-version to the template so clones carry their origin.',
    );
  }

  const config = readSiteConfig(projectDir);
  log.template = {
    ...log.template,
    repo: options.repo ?? log.template.repo ?? stamp?.repo,
    channel: options.channel ?? log.template.channel ?? DEFAULT_CHANNEL,
    baselineRelease,
    remote:
      options.remote ?? log.template.remote ?? config.template?.remote ?? stamp?.remote,
    ref: options.ref ?? log.template.ref ?? config.template?.ref ?? stamp?.ref,
    originCommit: log.template.originCommit ?? options.commit ?? stamp?.commit,
    lastReviewedCommit:
      log.template.lastReviewedCommit ?? options.commit ?? stamp?.commit,
  };

  writeUpgradeLog(projectDir, log);
  return log;
}

/**
 * Advance the baseline as far as the manifest allows: walk releases in order
 * above the current baseline and move the baseline forward across each release
 * whose every note has reached a terminal outcome in the log, stopping at the
 * first release that still has unfinished work. Also carries `lastReviewedCommit`
 * forward to the release's template commit. Mutates and returns `log`.
 */
export function advanceBaseline(
  log: UpgradeLog,
  releasesAscending: { id: string; templateCommit?: string; noteIds: string[] }[],
): UpgradeLog {
  const applied = log.upgrades ?? {};
  for (const release of releasesAscending) {
    const allTerminal = release.noteIds.every((id) => {
      const status = applied[id];
      return status != null && TERMINAL_OUTCOMES.has(status);
    });
    if (!allTerminal) break;
    log.template.baselineRelease = release.id;
    if (release.templateCommit) log.template.lastReviewedCommit = release.templateCommit;
  }
  return log;
}
