import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createFileDiscovery } from './doctor-file-discovery'

const roots: string[] = []
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'doctor-discovery-'))
  roots.push(root)
  const write = (name: string, source = '') => {
    mkdirSync(dirname(join(root, name)), { recursive: true })
    writeFileSync(join(root, name), source)
  }
  return { root, write }
}

describe('Doctor source discovery', () => {
  it('respects nested Git ignores and negation while retaining tracked files and new source', () => {
    const { root, write } = fixture()
    execFileSync('git', ['init', '-q', root])
    write('.gitignore', '.design-sync/\nlibs/*.ts\n!libs/new.ts\n')
    write('libs/.gitignore', 'local/\n')
    for (const name of [
      '.design-sync/.cache/generated.ts',
      'libs/ignored.ts',
      'libs/tracked.ts',
      'libs/new.ts',
      'libs/sub/source.ts',
      'libs/local/cache.ts',
    ])
      write(name)
    execFileSync('git', ['add', '-f', 'libs/tracked.ts'], { cwd: root })
    const walk = createFileDiscovery(root)
    expect(walk('.', (file) => file.endsWith('.ts'))).toEqual(['libs/new.ts', 'libs/sub/source.ts', 'libs/tracked.ts'])
    expect(walk('libs', (file) => file.endsWith('.ts'), false)).toEqual(['libs/new.ts', 'libs/tracked.ts'])
  })
  it('scans source archives without Git and never follows symlinks or build/dependency trees', () => {
    const { root, write } = fixture()
    for (const name of ['libs/source.ts', 'libs/dist/built.ts', 'node_modules/dependency.ts']) write(name)
    symlinkSync(root, join(root, 'libs/loop'))
    expect(createFileDiscovery(root)('.', (file) => file.endsWith('.ts'))).toEqual(['libs/source.ts'])
    expect(createFileDiscovery(root)('missing', () => true)).toEqual([])
  })
})
