import { describe, expect, it } from 'vitest'
import { analyzeAccessPolicies } from './doctor-access-policy-analysis'
import {
  callsEmulationEntry,
  isEmulationEntryName,
  readApiPrefixes,
  resolverScopeFindings,
} from './doctor-operation-analysis'
import { parseReasonedExemptions } from './doctor-reasoned-exemptions'

const operation = (body: string, parameters = "@Args('input') input: Input") => `
  @Resolver() class ExampleResolver { @Query(() => [Item]) list(${parameters}) { ${body} } }
`

describe('caller input and scope', () => {
  it.each([
    'return this.data.item.findMany({ select: { organizationId: true }, take: input.limit })',
    'return this.data.item.findMany({ where: { active: true }, select: { userId: true } })',
    'const organizationId = input.id; return this.data.item.findMany({ select: { organizationId: true } })',
    'return "this.data.item.findMany({ where: { organizationId: input.id } })"',
  ])('ignores select/output names and source text: %s', (body) => {
    expect(resolverScopeFindings(operation(body))).toEqual([])
  })

  it.each([
    'return this.data.item.findMany({ where: { organizationId: input.id } })',
    'return this.data.item.findFirstOrThrow({ where: { organizationId: input.id } })',
    'return this.data.item.findUniqueOrThrow({ where: { organizationId: input.id } })',
    'const where = { organizationId: input.id }; return this.data.item.findMany({ where })',
    'const ownerId = input.id; return this.data.item.update({ where: { userId: ownerId }, data: {} })',
  ])('detects caller-controlled filters: %s', (body) => {
    expect(resolverScopeFindings(operation(body))).toEqual([expect.objectContaining({ name: 'list' })])
  })

  it('accepts a filter scoped to an injected principal', () => {
    expect(
      resolverScopeFindings(
        operation(
          'return this.data.item.findMany({ where: { id: input.id, userId: principal.id } })',
          "@Args('input') input: Input, @CtxUser() principal: User",
        ),
      ),
    ).toEqual([])
  })

  it.each([
    'return this.data.item.findMany()',
    'this.audit.log({ actorId: principal.id }); return this.data.item.findMany()',
    'this.logger.info(principal.id); return this.data.item.findMany()',
    'return this.service.save({ data: { actorUserId: principal.id } })',
    'return this.service.save({ actorId: principal.id })',
    'const actorId = principal.id; return this.service.save({ actorId })',
    'const performedById = principal.id; return this.service.save({ data: { performedById } })',
  ])('does not treat identity injection or attribution as scope: %s', (body) => {
    expect(analyzeAccessPolicies(operation(body, '@CtxUser() principal: User')).operations[0].callerScoped).toBe(false)
  })

  it('still recognizes the principal passed to a service and direct self-service returns', () => {
    for (const body of [
      'return this.service.list(principal.id)',
      'return this.securityEventsService.getUserEvents(principal.id)',
      'return principal',
      'const identity = principal as User; if (!identity.isEmulating) throw new Error(); return this.service.end(token)',
    ]) {
      expect(analyzeAccessPolicies(operation(body, '@CtxUser() principal: User')).operations[0].callerScoped).toBe(true)
    }
  })
})

describe('inline permission predicates', () => {
  it.each([
    "const all = this.hasAnyPermissionInNamespace('items'); return this.data.item.findMany({ where: all ? {} : { ownerId } })",
    "if (this.hasAnyPermissionInNamespace('items')) return this.service.listAll(); return this.service.listOwn()",
    "return this.hasPermission('items.read')",
    "if (this.hasPermission('items.read')) return this.service.all(); return this.service.own(); throw new Error()",
  ])('allows scope widening or returning a capability: %s', (body) => {
    expect(analyzeAccessPolicies(operation(body)).inlineViolations).toEqual([])
  })

  it.each([
    "if (!this.hasAnyPermissionInNamespace('items')) throw new ForbiddenException(); return this.service.list()",
    "const allowed = this.hasPermission('items.read'); if (!allowed) return false; return this.service.list()",
    "const allowed = this.hasPermission('items.read'); const access = allowed; if (access) return this.service.list(); else throw new ForbiddenException()",
    "this.assertPermission('items.read'); return this.service.list()",
    "const allowed = this.hasPermission('items.read'); if (allowed) return this.service.list(); throw new ForbiddenException()",
    "if (this.hasAnyPermissionInNamespace('items')) { return this.service.list() }; this.logger.info('denied'); return false",
  ])('still reports checks that deny operation access: %s', (body) => {
    expect(analyzeAccessPolicies(operation(body)).inlineViolations).toHaveLength(1)
  })
})

describe('API prefix parsing', () => {
  it('ignores apostrophes and quoted decoys in trailing comments', () => {
    expect(
      readApiPrefixes(`const VALID_API_PREFIXES = [
      '/api/auth', // the caller's auth routes, not '/fake'
      '/api/public', /* "other" */
      \`/api/health\`,
    ] as const`),
    ).toEqual(['/api/auth', '/api/public', '/api/health'])
  })
  it('does not guess a dynamic prefix list', () => {
    expect(readApiPrefixes('const VALID_API_PREFIXES = buildPrefixes()')).toBeUndefined()
    expect(readApiPrefixes("const VALID_API_PREFIXES = ['/api', ...extra]")).toBeUndefined()
  })
})

describe('emulation entry points', () => {
  it.each(['emulate', 'emulateUser', 'adminEmulateUser', 'impersonateUser', 'beginImpersonateUser'])(
    'recognizes %s',
    (name) => {
      expect(isEmulationEntryName(name)).toBe(true)
      expect(callsEmulationEntry(`return this.auth.${name}(id)`)).toBe(true)
    },
  )
  it.each(['emulatedByOf', 'emulationStatus', 'impersonatedByOf', 'getEmulatedUser'])(
    'ignores read helper %s',
    (name) => {
      expect(isEmulationEntryName(name)).toBe(false)
      expect(callsEmulationEntry(`return this.auth.${name}(id)`)).toBe(false)
    },
  )
  it('ignores comments and literal text', () => {
    expect(callsEmulationEntry('/* this.auth.emulateUser(id) */ return "this.auth.emulateUser(id)"')).toBe(false)
  })
})

describe('reasoned scope declarations', () => {
  it('requires an operation-level non-empty reason', () => {
    expect(
      parseReasonedExemptions('{"admin.resolver.ts":{"list":"Platform permission permits cross-account reads"}}'),
    ).toEqual({
      'admin.resolver.ts': { list: 'Platform permission permits cross-account reads' },
    })
    for (const source of ['[]', 'null', '{"file":[]}', '{"file":{"list":true}}', '{"file":{"list":"  "}}']) {
      expect(() => parseReasonedExemptions(source)).toThrow()
    }
  })
})
