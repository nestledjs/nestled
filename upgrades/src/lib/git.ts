import { spawnSync } from 'node:child_process';

export interface GitResult {
  status: number;
  stdout: string;
  stderr: string;
}

export function git(cwd: string, args: string[]): GitResult {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export function gitOutput(cwd: string, args: string[]): string {
  const result = git(cwd, args);
  return result.status === 0 ? result.stdout.trim() : '';
}

export function isGitRepo(cwd: string): boolean {
  return gitOutput(cwd, ['rev-parse', '--is-inside-work-tree']) === 'true';
}

/** Uncommitted changes, ignoring our own `.nestled/` bookkeeping. */
export function hasUncommittedChanges(cwd: string): boolean {
  return gitOutput(cwd, ['status', '--porcelain'])
    .split('\n')
    .filter(Boolean)
    .some((line) => !line.includes('.nestled/'));
}

export function currentBranch(cwd: string): string {
  return gitOutput(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
}

export function checkoutBranch(cwd: string, branch: string): void {
  const existing = git(cwd, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
  const args = existing.status === 0 ? ['checkout', branch] : ['checkout', '-b', branch];
  const result = git(cwd, args);
  if (result.status !== 0) {
    throw new Error(`Unable to checkout ${branch}: ${result.stderr || result.stdout}`);
  }
}

export function commitAll(cwd: string, message: string): string {
  if (!gitOutput(cwd, ['status', '--porcelain'])) {
    return gitOutput(cwd, ['rev-parse', '--short', 'HEAD']);
  }
  if (git(cwd, ['add', '-A']).status !== 0) return '';
  if (git(cwd, ['commit', '--no-gpg-sign', '-m', message]).status !== 0) return '';
  return gitOutput(cwd, ['rev-parse', '--short', 'HEAD']);
}

/**
 * Restore a working tree that we dirtied, safe only when the caller verified the
 * tree was clean before starting: reverts tracked edits and removes files our
 * patches added, but preserves `.nestled/` so the log we are about to write
 * survives. Never call this when the run started `--allow-dirty`.
 */
export function resetWorktree(cwd: string): void {
  git(cwd, ['checkout', '--', '.']);
  git(cwd, ['clean', '-fd', '-e', '.nestled']);
}

export function ensureRemote(cwd: string, name: string, url: string): void {
  const existing = gitOutput(cwd, ['remote', 'get-url', name]);
  if (!existing) {
    git(cwd, ['remote', 'add', name, url]);
  } else if (url && existing !== url) {
    git(cwd, ['remote', 'set-url', name, url]);
  }
}

export interface FetchOptions {
  depth?: number;
  filterBlobless?: boolean;
}

export function fetchRef(cwd: string, remote: string, ref: string, options: FetchOptions = {}): GitResult {
  const args = ['fetch'];
  if (options.depth) args.push(`--depth=${options.depth}`);
  if (options.filterBlobless) args.push('--filter=blob:none');
  args.push(remote, ref);
  return git(cwd, args);
}

/** Read a file from a git rev (e.g. `remote/branch`) without a checkout. */
export function showFile(cwd: string, rev: string, repoPath: string): string | null {
  const result = git(cwd, ['show', `${rev}:${repoPath}`]);
  return result.status === 0 ? result.stdout : null;
}

export interface PrOptions {
  branch: string;
  base: string;
  title: string;
  body: string;
}

export interface PrResult {
  status: 'created' | 'blocked';
  url?: string;
  reason?: string;
}

export function pushAndCreatePR(cwd: string, options: PrOptions): PrResult {
  const push = git(cwd, ['push', '-u', 'origin', options.branch]);
  if (push.status !== 0) {
    return { status: 'blocked', reason: `Push failed: ${push.stderr || push.stdout}` };
  }
  const pr = spawnSync(
    'gh',
    ['pr', 'create', '--title', options.title, '--base', options.base, '--head', options.branch, '--body', options.body],
    { cwd, encoding: 'utf8' },
  );
  if ((pr.status ?? 1) !== 0) {
    return { status: 'blocked', reason: `PR creation failed: ${pr.stderr || pr.stdout}` };
  }
  return { status: 'created', url: (pr.stdout ?? '').trim() };
}
