import { execFileSync } from 'node:child_process'
import { lstatSync, readdirSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const excludedDirectories = new Set(['node_modules', 'dist', 'build', '.nx', '.git', '.claude'])

/** Git's own ignore semantics, including nested rules, negation and ignored-but-tracked files. */
export const createFileDiscovery = (cwd = process.cwd()) => {
  let visible: Set<string> | undefined
  try {
    visible = new Set(
      execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
        cwd,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .split('\0')
        .filter(Boolean),
    )
  } catch {
    // Source archives can run Doctor without Git metadata; still exclude build/dependency trees.
  }

  const directories = new Set<string>()
  for (const file of visible ?? []) {
    const parts = file.split('/')
    for (let index = 1; index < parts.length; index++) directories.add(parts.slice(0, index).join('/') + '/')
  }

  const walk = (directory: string, keep: (file: string) => boolean, recursive = true): string[] => {
    const files: string[] = []
    let entries: string[]
    try {
      entries = readdirSync(resolve(cwd, directory))
    } catch {
      return files
    }
    for (const entry of entries) {
      const file = join(directory, entry)
      let stat: ReturnType<typeof lstatSync>
      try {
        stat = lstatSync(resolve(cwd, file))
      } catch {
        continue
      }
      // Never follow a directory symlink out of the repository or into a traversal cycle.
      if (stat.isDirectory() && recursive && !excludedDirectories.has(entry)) {
        const prefix = relative(cwd, resolve(cwd, file)).split(sep).join('/') + '/'
        if (!visible || directories.has(prefix)) {
          files.push(...walk(file, keep))
        }
      } else if (stat.isFile() && keep(file)) {
        const key = relative(cwd, resolve(cwd, file)).split(sep).join('/')
        if (!visible || visible.has(key)) files.push(file)
      }
    }
    return files.sort((left, right) => left.localeCompare(right))
  }
  return walk
}
