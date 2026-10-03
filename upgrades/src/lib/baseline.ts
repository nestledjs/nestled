import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isMap, parse, parseDocument, stringify } from 'yaml';

/**
 * Per-clone state, stored at `<project>/.nestled/upgrade-log.yaml`. This is the
 * same file (and the same `template.originCommit` / `lastReviewedCommit` fields)
 * the private fleet upgrader already writes — we add `channel` and
 * `baselineRelease` so a standalone clone can compute what it still needs.
 */

export type Outcome =
  | 'applied'
  | 'adapted'
  | 'skipped'
  | 'blocked'
  | 'superseded'
  | 'not-applicable'
  | 'pending-release'
  | 'needs-review';

/** Outcomes that mean a note should not be offered again. */
export const TERMINAL_OUTCOMES: ReadonlySet<Outcome> = new Set<Outcome>([
  'applied',
  'adapted',
  'skipped',
  'superseded',
  'not-applicable',
]);

/**
 * `needs-review` is deliberately excluded from TERMINAL_OUTCOMES: the release that produced it
 * is held back from baseline advancement (see `applyRun`), so the note's `review` text keeps
 * being re-surfaced by `check`/`apply` on every run until a human or agent does the work and
 * hand-edits this entry to a terminal outcome (the same pattern already used for `blocked`).
 * Resolve it by setting the status to `applied` once the reviewed change is made, or
 * `not-applicable` if it doesn't apply to this project.
 */

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

/**
 * A ledger entry is either a bare outcome (`applied`) or, as written by hand and by the fleet
 * upgrader, a record carrying the outcome in `status` alongside notes, a date, a branch and so on.
 * Both forms are read; writing an outcome keeps a record's other fields.
 */
export type LedgerRecord = { status?: Outcome | string; [field: string]: unknown };
export type LedgerEntry = Outcome | LedgerRecord;

export interface UpgradeLog {
  template: TemplateState;
  upgrades: Record<string, LedgerEntry>;
}

/** The outcome recorded for a ledger entry, whichever form it takes. */
export function outcomeOf(entry: LedgerEntry | null | undefined): Outcome | undefined {
  if (entry == null) return undefined;
  if (typeof entry === 'string') return entry as Outcome;
  if (typeof entry === 'object' && typeof entry.status === 'string') return entry.status as Outcome;
  return undefined;
}

export function isTerminal(entry: LedgerEntry | null | undefined): boolean {
  const outcome = outcomeOf(entry);
  return outcome != null && TERMINAL_OUTCOMES.has(outcome);
}

/** Record an outcome, keeping the other fields of an existing record entry. */
export function setOutcome(log: UpgradeLog, id: string, outcome: Outcome): void {
  log.upgrades ??= {};
  const existing = log.upgrades[id];
  if (existing != null && typeof existing === 'object') {
    existing.status = outcome;
  } else {
    log.upgrades[id] = outcome;
  }
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

/**
 * Write the log. An existing file is updated in place (only changed values are touched), so
 * hand-written entries keep their quoting, comments and line breaks; a new file is serialized whole.
 */
export function writeUpgradeLog(projectDir: string, log: UpgradeLog): void {
  const file = logPathFor(projectDir);
  mkdirSync(dirname(file), { recursive: true });
  if (!existsSync(file)) {
    writeFileSync(file, stringify(log, { lineWidth: 0 }), 'utf8');
    return;
  }
  const doc = parseDocument(readFileSync(file, 'utf8'));
  const before = (doc.toJS() as Partial<UpgradeLog> | null) ?? {};
  const beforeTemplate = (before.template ?? {}) as Record<string, unknown>;
  const template = (log.template ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(template)) {
    if (value === undefined) continue;
    if (beforeTemplate[key] !== value) doc.setIn(['template', key], value);
  }
  for (const key of Object.keys(beforeTemplate)) {
    if (template[key] === undefined) doc.deleteIn(['template', key]);
  }
  for (const id of Object.keys(before.upgrades ?? {})) {
    if (log.upgrades?.[id] === undefined) doc.deleteIn(['upgrades', id]);
  }
  for (const [id, entry] of Object.entries(log.upgrades ?? {})) {
    const previous = before.upgrades?.[id];
    if (
      previous != null &&
      typeof previous === 'object' &&
      entry != null &&
      typeof entry === 'object' &&
      isMap(doc.getIn(['upgrades', id]))
    ) {
      // Record entry: write each changed field in place and drop removed ones, so untouched fields
      // keep their original formatting.
      for (const [field, value] of Object.entries(entry)) {
        if (value === undefined) continue;
        if (JSON.stringify(previous[field]) !== JSON.stringify(value)) doc.setIn(['upgrades', id, field], value);
      }
      for (const field of Object.keys(previous)) {
        if (!(field in entry) || entry[field] === undefined) doc.deleteIn(['upgrades', id, field]);
      }
    } else if (JSON.stringify(previous) !== JSON.stringify(entry)) {
      doc.setIn(['upgrades', id], entry);
    }
  }
  writeFileSync(file, doc.toString({ lineWidth: 0 }), 'utf8');
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
    const allTerminal = release.noteIds.every((id) => isTerminal(applied[id]));
    if (!allTerminal) break;
    log.template.baselineRelease = release.id;
    if (release.templateCommit) log.template.lastReviewedCommit = release.templateCommit;
  }
  return log;
}
