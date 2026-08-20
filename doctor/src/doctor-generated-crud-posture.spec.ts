import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  GENERATED_CRUD_POSTURES,
  GENERATED_CRUD_POSTURE_PATH,
  readGeneratedCrudPosture,
} from './doctor-generated-crud-posture'

const writePostureFile = (contents: string): string => {
  const file = join(mkdtempSync(join(tmpdir(), 'posture-')), 'generated-crud-posture.json')
  writeFileSync(file, contents, 'utf8')
  return file
}

describe('readGeneratedCrudPosture', () => {
  it('defaults to admin when no file exists', () => {
    expect(readGeneratedCrudPosture(join(tmpdir(), 'definitely-absent-posture.json'))).toEqual({
      posture: 'admin',
    })
  })

  it('reads a declared posture and its reason', () => {
    const file = writePostureFile(
      JSON.stringify({ posture: 'authenticated', reason: 'Emergency rollback' }),
    )

    expect(readGeneratedCrudPosture(file)).toEqual({
      posture: 'authenticated',
      reason: 'Emergency rollback',
    })
  })

  it('reads an explicit admin posture', () => {
    expect(
      readGeneratedCrudPosture(writePostureFile(JSON.stringify({ posture: 'admin' }))),
    ).toEqual({ posture: 'admin', reason: undefined })
  })

  // Every rejection path must land on admin. A relaxed tier may only come from a positively
  // recognized declaration — anything else and the doctor could assert a weaker tier than the
  // generator actually emitted.
  it.each([
    ['unparseable JSON', '{ not json', 'unparseable JSON'],
    ['a JSON array', '["admin"]', 'not a JSON object'],
    ['a JSON string', '"admin"', 'not a JSON object'],
    ['null', 'null', 'not a JSON object'],
    ['no posture key', '{"reason":"x"}', 'no "posture" key'],
    ['a non-string posture', '{"posture":123}', 'a non-string posture (123)'],
    ['an unknown posture', '{"posture":"public"}', 'an unrecognized posture "public"'],
    ['an empty posture', '{"posture":""}', 'an unrecognized posture ""'],
  ])('falls back to admin on %s', (_label, contents, invalid) => {
    const reading = readGeneratedCrudPosture(writePostureFile(contents))

    expect(reading.posture).toBe('admin')
    expect(reading.invalid).toBe(invalid)
  })

  it('distinguishes an unreadable file from unparseable JSON', () => {
    // A directory at the posture path exists but cannot be read as a file — the same shape as a
    // permissions or transient filesystem error, and it must not be reported as bad JSON.
    const directory = mkdtempSync(join(tmpdir(), 'posture-dir-'))
    const reading = readGeneratedCrudPosture(directory)

    expect(reading.posture).toBe('admin')
    expect(reading.invalid).toBe('a file that exists but could not be read')
  })

  it('is case-sensitive — "Authenticated" is not a posture', () => {
    const reading = readGeneratedCrudPosture(writePostureFile('{"posture":"Authenticated"}'))

    expect(reading.posture).toBe('admin')
    expect(reading.invalid).toContain('unrecognized')
  })
})

// These constants are mirrored from @nestledjs/generators rather than imported (its reader takes an
// Nx Tree). If the generator ever changes them, the doctor would silently assert a tier the
// generator no longer emits — so pin them against the installed package's own source.
describe('stays in step with @nestledjs/generators', () => {
  const generatorSource = readFileSync(
    'node_modules/@nestledjs/generators/src/crud/generator.js',
    'utf8',
  )

  it('uses the same posture file path', () => {
    expect(generatorSource).toContain(GENERATED_CRUD_POSTURE_PATH)
  })

  it('recognizes the same posture values', () => {
    for (const posture of GENERATED_CRUD_POSTURES) {
      expect(generatorSource).toContain(`'${posture}'`)
    }
  })

  it('agrees that admin is the fallback', () => {
    expect(generatorSource).toContain("{ posture: 'admin' }")
  })
})
