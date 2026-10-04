import { describe, expect, it } from 'vitest'
import { getAuthOperations, getGuardRank } from './doctor-auth-analysis'
import {
  getComposedGuardDecorators,
  getComposedGuardDefinitions,
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
    expect(getComposedGuardDefinitions('export const n = 1').get('n')?.guards.size).toBe(0)
  })

  it('pre-filters files that cannot declare a composed guard', () => {
    expect(mayDeclareComposedGuards('export const x = 1')).toBe(false)
    expect(mayDeclareComposedGuards('applyDecorators(SetMetadata(K, v))')).toBe(true)
    expect(mayDeclareComposedGuards("export const A = () => RequirePlatformPermission('x')")).toBe(true)
  })
})
