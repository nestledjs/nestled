import { computePending, PendingResult } from './pending';
import {
  DEFAULT_CHANNEL,
  initBaseline,
  readTemplateStamp,
  readUpgradeLog,
} from './baseline';
import { resolveFeed } from './feed';
import { applyRun, ApplyRunResult } from './apply';

interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = 'help', ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next != null && !next.startsWith('--')) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { command, flags };
}

function str(flags: ParsedArgs['flags'], key: string): string | undefined {
  return typeof flags[key] === 'string' ? (flags[key] as string) : undefined;
}

function projectDirFrom(flags: ParsedArgs['flags']): string {
  return str(flags, 'project') ?? process.cwd();
}

function feedOptions(flags: ParsedArgs['flags']) {
  return {
    manifestFile: str(flags, 'manifest'),
    remote: str(flags, 'remote'),
    ref: str(flags, 'ref'),
  };
}

function printPending(pending: PendingResult): void {
  if (pending.notes.length === 0) {
    console.log(
      `Up to date on channel "${pending.channel}" (baseline ${pending.baseline ?? 'unset'}` +
        `${pending.ceiling ? `, channel at ${pending.ceiling}` : ''}).`,
    );
    return;
  }
  console.log(
    `${pending.notes.length} pending note(s) on channel "${pending.channel}" ` +
      `(baseline ${pending.baseline ?? 'unset'} → ${pending.ceiling}):\n`,
  );
  for (const release of pending.releases) {
    const notes = pending.notes.filter((n) => n.releaseId === release.id);
    if (notes.length === 0) continue;
    console.log(`  ${release.id}${release.title ? ` — ${release.title}` : ''}`);
    for (const note of notes) {
      const flag = note.status ? ` [${note.status}]` : '';
      console.log(`    • ${note.id} (${note.delivery})${flag} — ${note.title}`);
    }
  }
}

function cmdInit(flags: ParsedArgs['flags']): number {
  const projectDir = projectDirFrom(flags);
  const log = initBaseline(projectDir, {
    at: str(flags, 'at'),
    channel: str(flags, 'channel'),
    repo: str(flags, 'repo'),
    remote: str(flags, 'remote'),
    ref: str(flags, 'ref'),
  });
  console.log(
    `Initialised baseline: channel "${log.template.channel}", ` +
      `baseline release ${log.template.baselineRelease}` +
      `${log.template.remote ? `, feed ${log.template.remote}@${log.template.ref ?? 'develop'}` : ''}.`,
  );
  if (!readTemplateStamp(projectDir) && !flags.at) {
    console.log(
      'Note: no .nestled/template-version stamp found; baseline was taken from ' +
        'existing state. For a legacy clone, pass --at <release> to be explicit.',
    );
  }
  return 0;
}

function cmdCheck(flags: ParsedArgs['flags']): number {
  const projectDir = projectDirFrom(flags);
  const log = readUpgradeLog(projectDir);
  const feed = resolveFeed(projectDir, log, feedOptions(flags));
  printPending(computePending(feed.manifest, log));
  return 0;
}

function cmdStatus(flags: ParsedArgs['flags']): number {
  const projectDir = projectDirFrom(flags);
  const log = readUpgradeLog(projectDir);
  console.log(`channel:  ${log.template.channel ?? DEFAULT_CHANNEL} (default applied if unset)`);
  console.log(`baseline: ${log.template.baselineRelease ?? '(unset — run `nestled-update init`)'}`);
  console.log(`feed:     ${log.template.remote ? `${log.template.remote}@${log.template.ref ?? 'develop'}` : '(unset)'}`);
  console.log(`origin:   ${log.template.originCommit ?? '(unknown)'}`);
  const outcomes = Object.entries(log.upgrades ?? {});
  console.log(`applied history: ${outcomes.length} recorded`);
  for (const [id, outcome] of outcomes) {
    console.log(`  ${id}: ${outcome}`);
  }
  return 0;
}

function reportApply(result: ApplyRunResult): number {
  switch (result.status) {
    case 'up-to-date':
      console.log(`Up to date on channel "${result.channel}" (baseline ${result.baselineRelease ?? 'unset'}).`);
      return 0;
    case 'applied':
      console.log(`Applied ${result.applied.length} note(s) on branch ${result.branch}:`);
      for (const note of result.applied) {
        const via = note.via3way ? ' (3-way)' : note.alreadyApplied ? ' (already present)' : '';
        console.log(`  • ${note.id} — ${note.title}${via}`);
      }
      console.log(`Baseline advanced to ${result.baselineRelease ?? 'unset'}.`);
      if (result.pr?.status === 'created') console.log(`PR: ${result.pr.url}`);
      if (result.pr?.status === 'blocked') console.log(`PR not created: ${result.pr.reason}`);
      return 0;
    case 'blocked':
      console.error(`Blocked at ${result.blocked?.id}: ${result.blocked?.reason}`);
      if (result.blocked?.output) console.error(result.blocked.output);
      console.error('Nothing was applied; the branch was rolled back. Adapt the note by intent, then re-run.');
      return 1;
    case 'verification-failed':
      console.error(`Verification failed: ${result.blocked?.reason}`);
      console.error('Applied changes were rolled back so the tree stays clean. Fix and re-run.');
      return 1;
    default:
      return 1;
  }
}

function cmdApply(flags: ParsedArgs['flags']): number {
  const projectDir = projectDirFrom(flags);
  const verify = str(flags, 'verify');
  const result = applyRun(projectDir, {
    ...feedOptions(flags),
    allowDirty: flags['allow-dirty'] === true,
    autoPR: flags.pr === true ? true : undefined,
    verification: verify != null ? verify.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    defaultBranch: str(flags, 'base'),
  });
  return reportApply(result);
}

const HELP = `nestled-update — apply Nestled template upgrades to this project

Usage: nestled-update <command> [options]

Commands:
  init      Establish the baseline for this clone (from .nestled/template-version or --at)
  check     Show pending upgrades for this project's channel (no changes)
  status    Show current channel, baseline, feed, and applied history
  apply     Apply pending upgrades on a branch (all-or-nothing, verified, rollback on failure)
  help      Show this help

Options:
  --project <dir>    Target project directory (default: cwd)
  --manifest <path>  Read the feed from a local manifest file (dev/testing/offline)
  --remote <url>     Template git URL for the feed (init records it; overrides the log)
  --ref <branch>     Feed branch on the template (default: develop)
  --channel <name>   Channel to follow: stable | canary (init only; default: stable)
  --at <release>     Explicit baseline release id (init only)
  --repo <name>      Template repo name to record (init only)
  --verify <cmds>    Comma-separated verification commands (apply; else inferred)
  --pr               Push the branch and open a PR after a successful apply
  --base <branch>    Base branch for the PR (default: develop)
  --allow-dirty      Allow apply when the working tree has uncommitted changes
`;

export function run(argv: string[]): number {
  const { command, flags } = parseArgs(argv);
  try {
    switch (command) {
      case 'init':
        return cmdInit(flags);
      case 'check':
        return cmdCheck(flags);
      case 'status':
        return cmdStatus(flags);
      case 'apply':
        return cmdApply(flags);
      case 'help':
      case '--help':
      case '-h':
        console.log(HELP);
        return 0;
      default:
        console.error(`Unknown command: ${command}\n`);
        console.log(HELP);
        return 1;
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    return 1;
  }
}
