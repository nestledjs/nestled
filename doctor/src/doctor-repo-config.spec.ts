import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readRepoConfig } from './doctor-repo-config'

const roots: string[] = []
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))
const config = (auditModels: unknown): string => {
  const root = mkdtempSync(join(tmpdir(), 'doctor-audit-models-'))
  roots.push(root)
  mkdirSync(join(root, '.nestled-updates'))
  writeFileSync(
    join(root, '.nestled-updates/doctor.config.json'),
    JSON.stringify({ selectFileSuffixes: ['.select.ts'], auditModels }),
  )
  return root
}

describe('durable audit-model declarations', () => {
  it('accepts delegate names and leaves the list optional', () => {
    expect(readRepoConfig(config(['deletionRequest'])).auditModels).toEqual(['deletionRequest'])
    expect(readRepoConfig(config(undefined)).auditModels).toEqual([])
  })
  it.each([null, '', 'deletionRequest', [null], [''], ['delegate.create'], [42]])(
    'rejects invalid model declarations: %j',
    (value) => {
      expect(() => readRepoConfig(config(value))).toThrow('auditModels must be an array of Prisma model delegate names')
    },
  )
})
