import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  DECLARED_GUARDS_PATH,
  declaredGuardsOn,
  parseDeclaredGuards,
  readDeclaredGuards,
  unusedDeclaredGuards,
} from './doctor-declared-guards'

const billingGuard = {
  authLevel: 'authenticated',
  grants: ['billing:manage'],
  superAdminBypass: true,
  reason: 'Billing staff operate the billing system; super-admin-only would deny its primary users.',
}

describe('parseDeclaredGuards', () => {
  it('reads a valid declaration', () => {
    const reading = parseDeclaredGuards(JSON.stringify({ GqlAuthBillingAdminGuard: billingGuard }))

    expect(reading.problems).toEqual([])
    expect(reading.guards.get('GqlAuthBillingAdminGuard')).toEqual({
      name: 'GqlAuthBillingAdminGuard',
      ...billingGuard,
    })
  })

  it('defaults superAdminBypass to false when omitted', () => {
    const withoutBypass: Partial<typeof billingGuard> = { ...billingGuard }
    delete withoutBypass.superAdminBypass
    const reading = parseDeclaredGuards(JSON.stringify({ StaffGuard: withoutBypass }))

    expect(reading.guards.get('StaffGuard')?.superAdminBypass).toBe(false)
  })

  it.each([
    ['a non-object entry', 'true', 'must be an object'],
    ['an array entry', '["billing:manage"]', 'must be an object'],
    ['a missing reason', JSON.stringify({ ...billingGuard, reason: undefined }), 'has no "reason"'],
    ['a blank reason', JSON.stringify({ ...billingGuard, reason: '   ' }), 'has no "reason"'],
    ['an unknown authLevel', JSON.stringify({ ...billingGuard, authLevel: 'superadmin' }), 'authLevel "superadmin"'],
    ['a public authLevel', JSON.stringify({ ...billingGuard, authLevel: 'public' }), 'authLevel "public"'],
    ['missing grants', JSON.stringify({ ...billingGuard, grants: undefined }), '"grants"'],
    ['empty grants', JSON.stringify({ ...billingGuard, grants: [] }), '"grants"'],
    ['non-string grants', JSON.stringify({ ...billingGuard, grants: ['billing:manage', 3] }), '"grants"'],
    ['a non-boolean bypass', JSON.stringify({ ...billingGuard, superAdminBypass: 'yes' }), 'superAdminBypass'],
  ])('rejects %s and recognizes nothing for it', (_label, entry, problem) => {
    const reading = parseDeclaredGuards(`{"GqlAuthBillingAdminGuard": ${entry}}`)

    expect(reading.guards.size).toBe(0)
    expect(reading.problems).toHaveLength(1)
    expect(reading.problems[0]).toContain('GqlAuthBillingAdminGuard')
    expect(reading.problems[0]).toContain(problem)
  })

  it('rejects a key doctor could never see as a guard', () => {
    const reading = parseDeclaredGuards(JSON.stringify({ billingAdmin: billingGuard }))

    expect(reading.guards.size).toBe(0)
    expect(reading.problems[0]).toContain('not a guard name')
  })

  it('keeps valid entries when a sibling is invalid', () => {
    const reading = parseDeclaredGuards(
      JSON.stringify({ GqlAuthBillingAdminGuard: billingGuard, StaffGuard: { ...billingGuard, reason: '' } }),
    )

    expect([...reading.guards.keys()]).toEqual(['GqlAuthBillingAdminGuard'])
    expect(reading.problems).toHaveLength(1)
  })

  it.each([
    ['unparseable JSON', '{ nope', 'not valid JSON'],
    ['a JSON array', '[]', 'JSON object'],
    ['null', 'null', 'JSON object'],
  ])('rejects %s as a whole', (_label, contents, problem) => {
    const reading = parseDeclaredGuards(contents)

    expect(reading.guards.size).toBe(0)
    expect(reading.problems[0]).toContain(problem)
  })
})

describe('readDeclaredGuards', () => {
  it('lives beside the other security declarations', () => {
    expect(DECLARED_GUARDS_PATH).toBe('.nestled-updates/security/declared-guards.json')
  })

  it('declares nothing, without a problem, when the file is absent', () => {
    expect(readDeclaredGuards(join(tmpdir(), 'definitely-absent-declared-guards.json'))).toEqual({
      guards: new Map(),
      problems: [],
    })
  })

  it('reads the file from disk', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'declared-guards-')), 'declared-guards.json')
    writeFileSync(file, JSON.stringify({ GqlAuthBillingAdminGuard: billingGuard }), 'utf8')

    expect([...readDeclaredGuards(file).guards.keys()]).toEqual(['GqlAuthBillingAdminGuard'])
  })

  it('reports a path that exists but cannot be read', () => {
    expect(readDeclaredGuards(mkdtempSync(join(tmpdir(), 'declared-guards-dir-'))).problems).toEqual([
      'the file exists but could not be read',
    ])
  })
})

describe('declared guard usage', () => {
  const guards = parseDeclaredGuards(
    JSON.stringify({ GqlAuthBillingAdminGuard: billingGuard, ReportsGuard: billingGuard }),
  ).guards

  it('finds the declared guards among an operation guard list', () => {
    expect(declaredGuardsOn(['GqlAuthBillingAdminGuard', 'GqlThrottlerGuard'], guards)).toEqual([
      'GqlAuthBillingAdminGuard',
    ])
    expect(declaredGuardsOn(['GqlAuthGuard'], guards)).toEqual([])
  })

  it('reports a declaration no operation uses', () => {
    expect(unusedDeclaredGuards(guards, new Set(['GqlAuthBillingAdminGuard']))).toEqual(['ReportsGuard'])
    expect(unusedDeclaredGuards(guards, new Set(['GqlAuthBillingAdminGuard', 'ReportsGuard']))).toEqual([])
  })
})
