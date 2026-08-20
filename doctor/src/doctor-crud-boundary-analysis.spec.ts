import { describe, expect, it } from 'vitest'
import {
  getCrudAuthAnnotationLines,
  getCustomResolverNameViolations,
  getGeneratedCrudImportViolations,
  getGraphqlRootFieldNames,
  getLegacyCoreHelpersImportViolations,
  getNonAdminOperationViolations,
  getNonAuthenticatedOperationViolations,
  getInlineClientGeneratedCrudViolations,
  getPublicSdkGeneratedCrudViolations,
  isHandwrittenApiFile,
  supportsAdminOnlyGeneratorBoundary,
} from './doctor-crud-boundary-analysis'

describe('generated CRUD boundary analysis', () => {
  it('requires the strict-compatible Generator 3 admin-only contract', () => {
    expect(supportsAdminOnlyGeneratorBoundary('2.0.0')).toBe(false)
    expect(supportsAdminOnlyGeneratorBoundary('3.0.0')).toBe(false)
    expect(supportsAdminOnlyGeneratorBoundary('3.0.1')).toBe(false)
    expect(supportsAdminOnlyGeneratorBoundary('3.0.2')).toBe(false)
    expect(supportsAdminOnlyGeneratorBoundary('3.0.3')).toBe(true)
    expect(supportsAdminOnlyGeneratorBoundary('3.1.0')).toBe(true)
    expect(supportsAdminOnlyGeneratorBoundary('4.1.0-beta.1')).toBe(true)
    expect(supportsAdminOnlyGeneratorBoundary('workspace:*')).toBe(false)
  })

  it('rejects generated CRUD imports from application API code', () => {
    const violations = getGeneratedCrudImportViolations(`
      import type { ListUserInput } from '@example/api/generated-crud/data-access'
      const service = require('@example/api/generated-crud/feature')
    `)

    expect(violations).toHaveLength(2)
    expect(violations[0].message).toContain('explicit input and Prisma query')
    expect(violations[0].message).toContain('no admin-only exception')
  })

  it('does not reject the normal explicit Prisma data-access wrapper', () => {
    expect(
      getGeneratedCrudImportViolations(`
        import { ApiCoreDataAccessService } from '@example/api/core/data-access'
      `),
    ).toEqual([])
  })

  it('classifies handwritten API files with POSIX and Windows separators', () => {
    expect(isHandwrittenApiFile('libs/api/custom/src/lib/user.resolver.ts')).toBe(true)
    expect(isHandwrittenApiFile('libs\\api\\custom\\src\\lib\\user.resolver.ts')).toBe(true)
    expect(isHandwrittenApiFile('apps\\api\\src\\app.module.ts')).toBe(false)
    expect(
      isHandwrittenApiFile('libs\\api\\generated-crud\\feature\\src\\lib\\user.resolver.ts'),
    ).toBe(false)
    expect(isHandwrittenApiFile('libs\\api\\custom\\src\\lib\\user.resolver.spec.ts')).toBe(false)
  })

  it('rejects every form of import from the removed core-helper library', () => {
    expect(
      getLegacyCoreHelpersImportViolations(`
        import { createSelect } from '@example/api/core/helpers'
        const helpers = require('@example/api/core/helpers/testing')
      `),
    ).toHaveLength(2)
  })

  it('finds every deprecated crudAuth annotation', () => {
    expect(
      getCrudAuthAnnotationLines(`
        /// @crudAuth: { "readOne": "user" }
        model User {}
        /// @crudAuth: { "readMany": "public" }
      `),
    ).toEqual([2, 4])
  })

  it('allows explicit admin-prefixed operations but rejects generated CRUD collisions', () => {
    expect(
      getCustomResolverNameViolations(
        `
          @Resolver(() => User)
          class UserResolver {
            @Mutation(() => User)
            adminDeleteUser() {}

            @Mutation(() => User)
            updateUser() {}
          }
        `,
        new Set(['updateUser', 'deleteUser']),
      ),
    ).toEqual([
      expect.objectContaining({
        message: 'Custom resolver method "updateUser" collides with a generated CRUD field name',
      }),
    ])
  })

  it('rejects application SDK operations that call generated admin CRUD fields', () => {
    const generatedFields = getGraphqlRootFieldNames(`
      query __AdminUsers($input: ListUserInput) {
        users(input: $input) { id }
        count: usersCount(input: $input) { count }
      }
    `)

    expect(
      getPublicSdkGeneratedCrudViolations(
        `
          query ActiveUsers {
            results: users(input: { filters: { isActive: { equals: true } } }) { id }
          }
        `,
        generatedFields,
      ),
    ).toEqual([
      expect.objectContaining({
        line: 3,
        message: expect.stringContaining('ActiveUsers calls generated admin CRUD field users'),
      }),
    ])
  })

  it('rejects generated admin CRUD fields behind root-level inline fragments', () => {
    expect(
      getPublicSdkGeneratedCrudViolations(
        `
          query ActiveUsers {
            ... on Query {
              users { id }
            }
          }
        `,
        new Set(['users']),
      ),
    ).toEqual([
      expect.objectContaining({
        line: 4,
        message: expect.stringContaining('ActiveUsers calls generated admin CRUD field users'),
      }),
    ])
  })

  it('rejects generated admin CRUD fields behind root-level named fragments', () => {
    expect(
      getPublicSdkGeneratedCrudViolations(
        `
          query ActiveUsers {
            ...GeneratedUsers
          }
          fragment GeneratedUsers on Query {
            users { id }
          }
        `,
        new Set(['users']),
      ),
    ).toEqual([
      expect.objectContaining({
        line: 3,
        message: expect.stringContaining('ActiveUsers calls generated admin CRUD field users'),
      }),
    ])
  })

  it('rejects generated admin CRUD fields from root fragments in another SDK file', () => {
    expect(
      getPublicSdkGeneratedCrudViolations(
        `
          query ActiveUsers {
            ...GeneratedUsers
          }
        `,
        new Set(['users']),
        [
          `
            fragment GeneratedUsers on Query {
              users { id }
            }
          `,
        ],
      ),
    ).toEqual([
      expect.objectContaining({
        line: 3,
        message: expect.stringContaining('ActiveUsers calls generated admin CRUD field users'),
      }),
    ])
  })

  it('accepts purpose-built application SDK operations and fragments', () => {
    const generatedFields = new Set(['users', 'usersCount', 'updateUser'])
    expect(
      getPublicSdkGeneratedCrudViolations(
        `
          query MyProfile { me { ...UserDetails } }
          mutation UpdateMyProfile($input: UpdateMyProfileInput!) {
            updateMyProfile(input: $input) { ...UserDetails }
          }
          fragment UserDetails on User { id }
        `,
        generatedFields,
      ),
    ).toEqual([])
  })

  it('accepts class-level admin protection for every resolver operation', () => {
    expect(
      getNonAdminOperationViolations(`
        @Resolver(() => Email)
        @UseGuards(GqlAuthAdminGuard)
        @AdminOnly()
        class AdminEmailResolver {
          @Mutation(() => Email)
          update() {}
        }
      `),
    ).toEqual([])
  })

  it('reports both a missing admin guard and missing admin declaration', () => {
    const violations = getNonAdminOperationViolations(`
      @Resolver(() => User)
      class UserResolver {
        @Query(() => User)
        @UseGuards(GqlAuthGuard)
        @Authenticated()
        user() {}
      }
    `)

    expect(violations.map(violation => violation.message)).toEqual([
      'UserResolver.user must use GqlAuthAdminGuard',
      'UserResolver.user must declare @AdminOnly()',
    ])
  })
})

describe('getInlineClientGeneratedCrudViolations', () => {
  const generatedRootFields = new Set(['plans', 'subscriptions', 'subscriptionsCount'])

  it('reports a generated CRUD root queried from an inline gql template', () => {
    const violations = getInlineClientGeneratedCrudViolations(
      `
        const DOC = gql\`
          query AdminPlans {
            plans {
              id
            }
          }
        \`
      `,
      generatedRootFields,
      'apps/web/app/routes/admin/billing/_index.tsx',
    )

    expect(violations).toHaveLength(1)
    expect(violations[0].message).toContain('plans')
  })

  // The bug this check exists for: a .tsx parsed as ScriptKind.TS is a syntax-error tree that
  // walks as EMPTY, so the files most likely to hold an inline document scanned clean.
  it('sees inline documents in a .tsx file containing JSX', () => {
    const violations = getInlineClientGeneratedCrudViolations(
      `
        const DOC = gql\`
          query AdminSubscriptions {
            subscriptions {
              id
            }
          }
        \`
        export function Page() {
          return <div className="p-4">{DOC ? <span>ok</span> : null}</div>
        }
      `,
      generatedRootFields,
      'apps/web/app/routes/admin/billing/subscriptions.tsx',
    )

    expect(violations).toHaveLength(1)
    expect(violations[0].message).toContain('subscriptions')
  })

  it('reports every generated root in one document', () => {
    const violations = getInlineClientGeneratedCrudViolations(
      `
        const DOC = gql\`
          query AdminSubscriptions {
            subscriptions {
              id
            }
            subscriptionsCount {
              total
            }
          }
        \`
      `,
      generatedRootFields,
      'page.tsx',
    )

    expect(violations).toHaveLength(2)
  })

  it('ignores documents that call no generated root', () => {
    expect(
      getInlineClientGeneratedCrudViolations(
        `
          const DOC = gql\`
            query AdminBillingPlans {
              adminBillingPlans {
                id
              }
            }
          \`
        `,
        generatedRootFields,
        'page.tsx',
      ),
    ).toEqual([])
  })

  it('ignores tagged templates that are not gql', () => {
    expect(
      getInlineClientGeneratedCrudViolations(
        'const styles = css`.plans { color: red }`',
        generatedRootFields,
        'page.tsx',
      ),
    ).toEqual([])
  })

  it('skips an interpolated template that is not a document on its own', () => {
    expect(() =>
      getInlineClientGeneratedCrudViolations(
        'const DOC = gql`${FRAGMENT} not a document`',
        generatedRootFields,
        'page.tsx',
      ),
    ).not.toThrow()
  })

  it('reports at the line the tagged template starts on', () => {
    const violations = getInlineClientGeneratedCrudViolations(
      ['// leading comment', '', 'const DOC = gql`', '  query A { plans { id } }', '`'].join('\n'),
      generatedRootFields,
      'page.tsx',
    )

    expect(violations[0].line).toBe(3)
  })
})

describe('getNonAuthenticatedOperationViolations', () => {
  it('accepts a resolver carrying GqlAuthGuard and @Authenticated', () => {
    expect(
      getNonAuthenticatedOperationViolations(`
        @Resolver(() => User)
        @UseGuards(GqlAuthGuard)
        @Authenticated()
        class GeneratedUserResolver {
          @Query(() => User)
          user() {}
        }
      `),
    ).toEqual([])
  })

  // A repo at `authenticated` posture is mid-migration, not unprotected — an operation with no
  // guard at all is still drift and must still be reported.
  it('reports an operation with no guard at all', () => {
    const violations = getNonAuthenticatedOperationViolations(`
      @Resolver(() => User)
      class GeneratedUserResolver {
        @Query(() => User)
        user() {}
      }
    `)

    expect(violations.map(violation => violation.message)).toEqual([
      'GeneratedUserResolver.user must use GqlAuthGuard (or the stricter GqlAuthAdminGuard) while generated-crud posture is authenticated',
      'GeneratedUserResolver.user must declare @Authenticated() (or the stricter @AdminOnly()) while generated-crud posture is authenticated',
    ])
  })

  // The stricter tier is never drift against the looser one: a repo part-way through restoring
  // admin should not be nagged for the operations it has already restored.
  it('accepts an operation that is still admin-only', () => {
    expect(
      getNonAuthenticatedOperationViolations(`
        @Resolver(() => User)
        @UseGuards(GqlAuthAdminGuard)
        @AdminOnly()
        class GeneratedUserResolver {
          @Query(() => User)
          user() {}
        }
      `),
    ).toEqual([])
  })
})
