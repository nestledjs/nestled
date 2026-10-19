import { describe, expect, it } from 'vitest'
import { getAuthOperations, getGuardRank, hasAuthenticationGuard } from './doctor-auth-analysis'
import {
  discoverComposedGuardDecorators,
  getComposedGuardDecorators,
  mayDeclareComposedGuards,
} from './doctor-composed-guards'

const restRoute = (decorators: string) => `
  @Controller('extension')
  export class ExtensionController {
    ${decorators}
    @Get('glossary')
    getGlossary() {}
  }
`

const guardsOf = (source: string, composedGuards = getComposedGuardDecorators([{ file: 'a.ts', source }])) =>
  getAuthOperations(source, 'extension.controller.ts', { composedGuards })[0].guardNames

describe('getComposedGuardDecorators', () => {
  it('reads guards a decorator composes with applyDecorators in the same file', () => {
    const source = `
      export const RequireStaffOnRestRoute = (...permissions: string[]) =>
        applyDecorators(
          SetMetadata(POLICY_KEY, { permissions }),
          UseGuards(AuthGuard('jwt'), PolicyGuard),
        )

      ${restRoute("@RequireStaffOnRestRoute('content.view')")}
    `

    expect(guardsOf(source)).toEqual(['AuthGuard', 'PolicyGuard'])
  })

  it('reads a decorator composed in another file', () => {
    const decoratorFile = `
      import { applyDecorators, UseGuards } from '@nestjs/common'
      export function StaffOnly() {
        return applyDecorators(Authenticated(), UseGuards(GqlAuthGuard, StaffGuard))
      }
    `
    const controllerFile = restRoute('@StaffOnly()')
    const composedGuards = getComposedGuardDecorators([
      { file: 'libs/api/utils/staff.decorator.ts', source: decoratorFile },
      { file: 'extension.controller.ts', source: controllerFile },
    ])

    expect(guardsOf(controllerFile, composedGuards)).toEqual(['GqlAuthGuard', 'StaffGuard'])
  })

  it('attributes a class-level composed decorator to every operation, like a literal class guard', () => {
    const composedGuards = getComposedGuardDecorators([
      { file: 'a.ts', source: 'export const Staff = applyDecorators(UseGuards(GqlAuthGuard, StaffGuard))' },
    ])
    const operations = getAuthOperations(
      `
        @Staff
        @Resolver()
        export class StaffResolver {
          @Query() one() {}
          @Mutation() two() {}
        }
      `,
      'staff.resolver.ts',
      { composedGuards },
    )

    expect(operations.map((operation) => operation.guardNames)).toEqual([
      ['GqlAuthGuard', 'StaffGuard'],
      ['GqlAuthGuard', 'StaffGuard'],
    ])
  })

  it('compares equal to a baseline that recorded the same guards written literally', () => {
    const literal = guardsOf(restRoute("@UseGuards(AuthGuard('jwt'))"))
    const composed = guardsOf(`
      export const RequireStaffOnRestRoute = (...permissions: string[]) =>
        applyDecorators(SetMetadata(POLICY_KEY, permissions), UseGuards(AuthGuard('jwt'), PolicyGuard))
      ${restRoute("@RequireStaffOnRestRoute('content.view')")}
    `)

    expect(literal).toEqual(['AuthGuard'])
    expect(getGuardRank(composed)).toBeGreaterThanOrEqual(getGuardRank(literal))
  })

  it('still reports a route that loses its composed decorator', () => {
    const decorators = getComposedGuardDecorators([
      {
        file: 'a.ts',
        source:
          "export const RequireStaffOnRestRoute = () => applyDecorators(UseGuards(AuthGuard('jwt'), PolicyGuard))",
      },
    ])
    const baseline = guardsOf(restRoute("@UseGuards(AuthGuard('jwt'))"))
    const afterRemoval = guardsOf(restRoute(''), decorators)

    expect(afterRemoval).toEqual([])
    expect(getGuardRank(afterRemoval)).toBeLessThan(getGuardRank(baseline))
  })

  it('resolves a factory that delegates to a private composing helper', () => {
    const composedGuards = getComposedGuardDecorators([
      {
        file: 'a.ts',
        source: `
          function staffDecorators(policy: Policy) {
            return applyDecorators(SetMetadata(KEY, policy), UseGuards(GqlAuthGuard, StaffGuard))
          }
          export const RequireStaff = (...permissions: string[]) => staffDecorators({ permissions })
        `,
      },
    ])

    expect(composedGuards.get('RequireStaff')).toEqual(['GqlAuthGuard', 'StaffGuard'])
  })

  it('resolves a wrapper around an access-policy decorator to the guards that decorator applies', () => {
    const composedGuards = getComposedGuardDecorators([
      { file: 'a.ts', source: "export const CanManageBilling = () => RequirePlatformPermission('billing:manage')" },
    ])

    expect(composedGuards.get('CanManageBilling')).toEqual(['AccessPolicyGuard', 'GqlAuthGuard'])
  })

  it('keeps an under-class policy wrapper separate from authentication', () => {
    const composedGuards = getComposedGuardDecorators([
      {
        file: 'policy.ts',
        source: "export const CanReadBilling = () => RequirePlatformPermissionUnderClassGuard('platform.billing.read')",
      },
    ])
    expect(composedGuards.get('CanReadBilling')).toEqual(['AccessPolicyGuard'])
    const [withoutClassGuard] = getAuthOperations(restRoute('@CanReadBilling()'), 'route.ts', { composedGuards })
    expect(hasAuthenticationGuard(withoutClassGuard)).toBe(false)
    const [withClassGuard] = getAuthOperations(
      `
      @Resolver() @AdminOnly() @UseGuards(GqlAuthAdminGuard)
      class BillingResolver { @Query() @CanReadBilling() subscriptions() {} }
    `,
      'resolver.ts',
      { composedGuards },
    )
    expect(withClassGuard.guardNames).toEqual(['AccessPolicyGuard', 'GqlAuthAdminGuard'])
    expect(hasAuthenticationGuard(withClassGuard)).toBe(true)
  })

  it('leaves the access-policy decorators to their existing modelling', () => {
    const composedGuards = getComposedGuardDecorators([
      {
        file: 'a.ts',
        source:
          'export const RequirePlatformPermission = () => applyDecorators(UseGuards(GqlAuthGuard, AccessPolicyGuard, ExtraGuard))',
      },
    ])

    expect(composedGuards.has('RequirePlatformPermission')).toBe(false)
  })

  it('credits only the guards every definition of a duplicated name shares', () => {
    const composedGuards = getComposedGuardDecorators([
      { file: 'a.ts', source: 'export const Staff = () => applyDecorators(UseGuards(GqlAuthGuard, StaffGuard))' },
      { file: 'b.ts', source: 'export const Staff = () => applyDecorators(UseGuards(GqlAuthGuard))' },
    ])

    expect(composedGuards.get('Staff')).toEqual(['GqlAuthGuard'])
  })

  it('terminates on mutually recursive factories without crediting either', () => {
    const composedGuards = getComposedGuardDecorators([
      { file: 'a.ts', source: 'export const A = () => B()\nexport const B = () => A()' },
    ])

    expect(composedGuards.size).toBe(0)
  })

  it('ignores declarations that apply no guard', () => {
    expect(
      getComposedGuardDecorators([
        { file: 'a.ts', source: 'export const Policy = (...p: string[]) => SetMetadata(KEY, p)' },
      ]).size,
    ).toBe(0)
    expect(getComposedGuardDecorators([{ file: 'a.ts', source: 'export const n = 1' }]).size).toBe(0)
  })

  it('pre-filters files that cannot declare a composed guard', () => {
    expect(mayDeclareComposedGuards('export const x = 1')).toBe(false)
    expect(mayDeclareComposedGuards('applyDecorators(SetMetadata(K, v))')).toBe(true)
    expect(mayDeclareComposedGuards("export const A = () => RequirePlatformPermission('x')")).toBe(true)
  })

  it('does not credit a UseGuards call whose decorator is discarded', () => {
    const composedGuards = getComposedGuardDecorators([
      {
        file: 'a.ts',
        source: `
          export const LooksGuarded = () => {
            UseGuards(GqlAuthAdminGuard)
            return applyDecorators(SetMetadata(KEY, true))
          }
          export const AlsoDiscarded = () => applyDecorators(SetMetadata(KEY, [UseGuards(GqlAuthAdminGuard)]))
        `,
      },
    ])

    expect(composedGuards.has('LooksGuarded')).toBe(false)
    expect(composedGuards.has('AlsoDiscarded')).toBe(false)
  })

  it('credits a conditional return only with the guards every branch applies', () => {
    const composedGuards = getComposedGuardDecorators([
      {
        file: 'a.ts',
        source: `
          export const Ternary = (strict: boolean) =>
            strict
              ? applyDecorators(UseGuards(GqlAuthGuard, StaffGuard))
              : applyDecorators(UseGuards(GqlAuthGuard))
          export function Branches(strict: boolean) {
            if (strict) return applyDecorators(UseGuards(GqlAuthGuard, StaffGuard))
            return UseGuards(GqlAuthGuard, ReportsGuard)
          }
          export function Disjoint(strict: boolean) {
            if (strict) return UseGuards(StaffGuard)
            return UseGuards(ReportsGuard)
          }
        `,
      },
    ])

    expect(composedGuards.get('Ternary')).toEqual(['GqlAuthGuard'])
    expect(composedGuards.get('Branches')).toEqual(['GqlAuthGuard'])
    expect(composedGuards.has('Disjoint')).toBe(false)
  })

  it('credits nothing when a path can end without returning a decorator', () => {
    const composedGuards = getComposedGuardDecorators([
      {
        file: 'a.ts',
        source: `
          export function MaybeGuarded(strict: boolean) {
            if (strict) return applyDecorators(UseGuards(GqlAuthGuard))
          }
          export function BareReturn(strict: boolean) {
            if (strict) return
            return applyDecorators(UseGuards(GqlAuthGuard))
          }
        `,
      },
    ])

    expect(composedGuards.size).toBe(0)
  })

  it('ignores returns of functions nested inside the factory', () => {
    const composedGuards = getComposedGuardDecorators([
      {
        file: 'a.ts',
        source: `
          export function Staff() {
            const unused = () => UseGuards(GqlAuthAdminGuard)
            return applyDecorators(UseGuards(GqlAuthGuard))
          }
        `,
      },
    ])

    expect(composedGuards.get('Staff')).toEqual(['GqlAuthGuard'])
  })
})

describe('discoverComposedGuardDecorators', () => {
  const base = {
    file: 'libs/api/utils/base-guards.ts',
    source: 'export const BaseGuards = () => applyDecorators(UseGuards(GqlAuthGuard, StaffGuard))',
  }
  const wrapper = { file: 'libs/api/staff/staff-only.ts', source: 'export const StaffOnly = () => BaseGuards()' }
  const outer = { file: 'libs/api/staff/staff-admin.ts', source: 'export const StaffAdmin = () => StaffOnly()' }
  const unrelated = { file: 'libs/api/other/thing.ts', source: 'export const helper = () => compute()' }

  it('finds a wrapper in a file that only delegates to a composed factory defined elsewhere', () => {
    expect(mayDeclareComposedGuards(wrapper.source)).toBe(false)

    const composedGuards = discoverComposedGuardDecorators([base, wrapper, unrelated])

    expect(composedGuards.get('StaffOnly')).toEqual(['GqlAuthGuard', 'StaffGuard'])
    expect(composedGuards.has('helper')).toBe(false)
  })

  it('follows delegation through several files until nothing new is found', () => {
    expect(discoverComposedGuardDecorators([outer, wrapper, base]).get('StaffAdmin')).toEqual([
      'GqlAuthGuard',
      'StaffGuard',
    ])
  })

  it('does not match a discovered name inside a longer identifier', () => {
    const lookalike = { file: 'c.ts', source: 'export const X = () => BaseGuardsLegacy()' }

    expect(discoverComposedGuardDecorators([base, lookalike]).has('X')).toBe(false)
  })
})
