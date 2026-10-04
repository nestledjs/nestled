import { describe, expect, it } from 'vitest'
import {
  getUndeclaredAccessOperations,
  getUnauthorizedAccessOperations,
  analyzeAccessPolicies,
  readStringObjectArray,
} from './doctor-access-policy-analysis'
import { getAuthOperations } from './doctor-auth-analysis'
import { getComposedGuardDecorators } from './doctor-composed-guards'
import { parseDeclaredGuards } from './doctor-declared-guards'

describe('analyzeAccessPolicies', () => {
  it('extracts platform, organization, and public API scope literals without option prose', () => {
    const report = analyzeAccessPolicies(`
      @Resolver()
      class ResolverUnderTest {
        @Query(() => Boolean)
        @RequirePlatformPermission('platform.users.read', 'platform.users.manage')
        users() {}

        @Mutation(() => Boolean)
        @RequireOrganizationPermission(['member:update'], {
          organizationIdPath: 'input.organizationId',
        })
        updateMember() {}

        @Post()
        @RequirePublicApiScopes('write')
        importFans() {}
      }
    `)

    expect(report.declarations.map((item) => item.permissions)).toEqual([
      ['platform.users.read', 'platform.users.manage'],
      ['member:update'],
      ['write'],
    ])
    expect(report.declarations.map((item) => item.scope)).toEqual(['platform', 'organization', 'public-api'])
  })

  it('reports inline permission helpers on an operation with no declarative policy', () => {
    const report = analyzeAccessPolicies(`
      @Controller('reports')
      class ReportController {
        @Post()
        @Authenticated()
        async create() {
          await this.assertPermission('reports:create')
          return this.service.create()
        }
      }
    `)

    expect(report.inlineViolations).toEqual([
      expect.objectContaining({
        className: 'ReportController',
        name: 'create',
        calls: ['assertPermission'],
      }),
    ])
  })

  it('accepts a class-level policy as the declaration for its operations', () => {
    const report = analyzeAccessPolicies(`
      @Resolver()
      @RequirePlatformPermission('platform.audit.read')
      class AuditResolver {
        @Query(() => Boolean)
        audit() {
          return this.hasPermission('platform.audit.read')
        }
      }
    `)

    expect(report.inlineViolations).toEqual([])
    expect(report.declarations).toHaveLength(1)
  })
})

describe('readStringObjectArray', () => {
  it('reads only the named catalog and ignores similarly shaped role metadata', () => {
    const entries = readStringObjectArray(
      `
        export const permissions = [
          { key: 'platform.users.read', namespace: 'platform.users' },
        ] as const
        export const rootRole = { key: 'system.super-administrator' }
      `,
      'permissions',
      ['key'],
    )

    expect(entries).toEqual([{ key: 'platform.users.read' }])
  })

  it('finds the catalog when it is declared inside a function rather than at the top level', () => {
    // A repo that seeds permissions from a builder must not be handed an empty catalog (which would
    // then report every declared permission as "unknown").
    const entries = readStringObjectArray(
      `
        export function buildCatalog() {
          const permissions = [
            { key: 'platform.users.read' },
            { key: 'platform.users.manage' },
          ]
          return permissions
        }
      `,
      'permissions',
      ['key'],
    )

    expect(entries).toEqual([{ key: 'platform.users.read' }, { key: 'platform.users.manage' }])
  })

  it('skips a same-named non-array binding and finds the actual array literal (#54 review)', () => {
    // The first `permissions` is a call, not the catalog — the walk must keep going to the literal.
    const entries = readStringObjectArray(
      `
        export function build() {
          const permissions = derivePermissions()
          return permissions
        }
        export const permissions = [
          { key: 'platform.users.read' },
        ]
      `,
      'permissions',
      ['key'],
    )

    expect(entries).toEqual([{ key: 'platform.users.read' }])
  })
})

describe('getUndeclaredAccessOperations', () => {
  it('scopes a declared permission to its own class when two classes share a method name', () => {
    const undeclared = getUndeclaredAccessOperations(`
      @Resolver()
      @RequirePlatformPermission('reports.read')
      class ReportsResolver {
        @Query(() => Boolean)
        list(@Args('id') id: string) {}
      }

      @Resolver()
      class BillingResolver {
        @Query(() => Boolean)
        @RequirePlatformPermission('billing.read')
        summary(@Args('id') id: string) {}

        @Query(() => Boolean)
        list(@Args('id') id: string) {}
      }
    `)

    expect(undeclared.map((operation) => `${operation.className}.${operation.name}`)).toEqual(['BillingResolver.list'])
  })

  it('reports an operation with neither a permission nor caller scoping', () => {
    const undeclared = getUndeclaredAccessOperations(`
      @Resolver()
      class FileResolver {
        @Query(() => String)
        async getSignedUrl(@Args('uploadId') uploadId: string): Promise<string> {
          return this.service.getSignedUrl(uploadId)
        }
      }
    `)

    expect(undeclared.map((operation) => operation.name)).toEqual(['getSignedUrl'])
    expect(undeclared[0].callerScoped).toBe(false)
  })

  // @CtxUser() is a PARAMETER decorator, so detection has to read the whole method — a scan of the
  // method's own decorators, or of its body alone, misses it.
  // The template ships CtxUser, CtxOrganization AND CtxOrganizationId; repos add their own
  // (one downstream project has CtxOrganizationIdCached). An enumerated list would have to grow per repo, so the
  // detector matches the @Ctx* shape. Getting this wrong produced 382 findings against that
  // project claiming its scoped resolvers were unscoped.
  it.each([
    ['@CtxOrganization()', '@CtxOrganization() org: OrganizationContext'],
    ['@CtxOrganizationId()', '@CtxOrganizationId() organizationId: string'],
    ['a repo-local variant', '@CtxOrganizationIdCached() organizationId: string'],
  ])('treats %s as caller scoping', (_label, parameter) => {
    const undeclared = getUndeclaredAccessOperations(`
      @Resolver()
      class AlbumResolver {
        @Query(() => [Album])
        async userAlbums(${parameter}): Promise<Album[]> {
          return this.data.album.findMany({ where: { organizationId } })
        }
      }
    `)

    expect(undeclared[0].callerScoped).toBe(true)
  })

  // NestJS's own @Context() injects the whole GraphQL context and is not caller scoping. "Ctx" is a
  // literal prefix, so it must not match.
  it('does not treat @Context() as caller scoping', () => {
    const undeclared = getUndeclaredAccessOperations(`
      @Resolver()
      class ThingResolver {
        @Query(() => String)
        async thing(@Context() ctx: NestContextType, @Args('id') id: string): Promise<string> {
          return this.data.thing.findFirst({ where: { id } })
        }
      }
    `)

    expect(undeclared[0].callerScoped).toBe(false)
  })

  it('treats a @CtxUser() parameter as caller scoping', () => {
    const undeclared = getUndeclaredAccessOperations(`
      @Resolver()
      class FileResolver {
        @Query(() => [String])
        async userFiles(@CtxUser() user: User): Promise<string[]> {
          return this.service.getUserFiles(user.id)
        }
      }
    `)

    expect(undeclared[0].callerScoped).toBe(true)
  })

  it('treats an explicit inherited-parent authorization declaration as scoped', () => {
    const undeclared = getUndeclaredAccessOperations(`
      @Resolver(() => Account)
      class AccountResolver {
        @ResolveField(() => Decimal)
        @UseGuards(GqlAuthGuard)
        @InheritedParentAuthorization()
        availableBalance(@Parent() account: Account) {
          return account.availableBalance
        }
      }
    `)

    expect(undeclared).toHaveLength(1)
    expect(undeclared[0].name).toBe('availableBalance')
    expect(undeclared[0].callerScoped).toBe(true)
  })

  it('sees caller scoping even when an @Args object literal precedes the caller parameter', () => {
    const undeclared = getUndeclaredAccessOperations(`
      @Resolver()
      class FileResolver {
        @Mutation(() => Boolean)
        async deleteFile(
          @Args('uploadId', { type: () => String }) uploadId: string,
          @CtxUser() user: User,
        ): Promise<boolean> {
          await this.service.deleteFile(uploadId, user.id)
          return true
        }
      }
    `)

    expect(undeclared[0].callerScoped).toBe(true)
  })

  it('treats a declared permission as authorization and reports nothing', () => {
    expect(
      getUndeclaredAccessOperations(`
        @Resolver()
        class AdminResolver {
          @Mutation(() => Boolean)
          @RequirePlatformPermission('platform.users.manage')
          async unlockAccount(@Args('userId') userId: string): Promise<boolean> {
            return true
          }
        }
      `),
    ).toEqual([])
  })

  it('treats a class-wide permission as covering its operations', () => {
    expect(
      getUndeclaredAccessOperations(`
        @Resolver()
        @RequirePlatformPermission('platform.users.read')
        class AdminResolver {
          @Query(() => String)
          async anything(@Args('id') id: string): Promise<string> {
            return id
          }
        }
      `),
    ).toEqual([])
  })

  it('respects the guarded filter, so public operations are out of scope', () => {
    expect(
      getUndeclaredAccessOperations(
        `
          @Resolver()
          class AuthResolver {
            @Mutation(() => String)
            async login(@Args('email') email: string): Promise<string> {
              return email
            }
          }
        `,
        'auth.resolver.ts',
        () => false,
      ),
    ).toEqual([])
  })
})

describe('getUnauthorizedAccessOperations', () => {
  const declaredGuards = parseDeclaredGuards(
    JSON.stringify({
      GqlAuthBillingAdminGuard: {
        authLevel: 'authenticated',
        grants: ['billing:manage'],
        superAdminBypass: true,
        reason: 'Billing staff operate the billing system.',
      },
    }),
  ).guards

  const unauthorizedNames = (source: string, composedSources: string[] = []): string[] => {
    const composedGuards = getComposedGuardDecorators(
      composedSources.map((composed, index) => ({ file: `decorators-${index}.ts`, source: composed })),
    )
    const authOperations = getAuthOperations(source, 'billing.resolver.ts', { composedGuards })
    return getUnauthorizedAccessOperations(source, 'billing.resolver.ts', authOperations, declaredGuards).map(
      (operation) => operation.name,
    )
  }

  it('accepts an operation behind a declared guard at the method level', () => {
    expect(
      unauthorizedNames(`
        @Resolver()
        class BillingResolver {
          @Mutation(() => Boolean)
          @Authenticated()
          @UseGuards(GqlAuthBillingAdminGuard)
          closeBillingRun(@Args('id') id: string) {}

          @Query(() => Boolean)
          @Authenticated()
          @UseGuards(GqlAuthGuard)
          billingRuns(@Args('id') id: string) {}
        }
      `),
    ).toEqual(['billingRuns'])
  })

  it('accepts every operation behind a declared guard at the class level', () => {
    expect(
      unauthorizedNames(`
        @Authenticated()
        @UseGuards(GqlAuthBillingAdminGuard)
        @Resolver()
        class BillingResolver {
          @Query(() => Boolean)
          billingRuns(@Args('id') id: string) {}

          @Mutation(() => Boolean)
          closeBillingRun(@Args('id') id: string) {}
        }
      `),
    ).toEqual([])
  })

  it('accepts a declared guard applied through a composed decorator', () => {
    expect(
      unauthorizedNames(
        `
          @Resolver()
          class BillingResolver {
            @Query(() => Boolean)
            @BillingStaff()
            billingRuns(@Args('id') id: string) {}
          }
        `,
        ['export const BillingStaff = () => applyDecorators(Authenticated(), UseGuards(GqlAuthBillingAdminGuard))'],
      ),
    ).toEqual([])
  })

  it('still fails an operation behind a repo-local guard nobody declared', () => {
    expect(
      unauthorizedNames(`
        @Authenticated()
        @UseGuards(GqlAuthReportsGuard)
        @Resolver()
        class ReportsResolver {
          @Query(() => Boolean)
          reports(@Args('id') id: string) {}
        }
      `),
    ).toEqual(['reports'])
  })

  // Two resolvers in one file can share a method name. A declared guard on one must not authorize
  // the other: keyed by method name alone, the unguarded `list` disappeared from the findings.
  it('joins on class and method, so a declared guard on one class does not cover another', () => {
    const source = `
      @Resolver()
      class BillingResolver {
        @Query(() => Boolean)
        @Authenticated()
        @UseGuards(GqlAuthBillingAdminGuard)
        list(@Args('id') id: string) {}
      }

      @Resolver()
      class ReportsResolver {
        @Query(() => Boolean)
        @Authenticated()
        @UseGuards(GqlAuthGuard)
        list(@Args('id') id: string) {}
      }
    `
    const authOperations = getAuthOperations(source, 'billing.resolver.ts')
    const unauthorized = getUnauthorizedAccessOperations(source, 'billing.resolver.ts', authOperations, declaredGuards)

    expect(unauthorized.map((operation) => `${operation.className}.${operation.name}`)).toEqual([
      'ReportsResolver.list',
    ])
  })

  it('does not treat a public method as guarded because a same-named method elsewhere in the file is', () => {
    const source = `
      @Resolver()
      class PublicResolver {
        @Query(() => Boolean)
        @Public()
        list(@Args('id') id: string) {}
      }

      @Resolver()
      class ReportsResolver {
        @Query(() => Boolean)
        @Authenticated()
        @UseGuards(GqlAuthGuard)
        list(@Args('id') id: string) {}
      }
    `
    const authOperations = getAuthOperations(source, 'reports.resolver.ts')
    const unauthorized = getUnauthorizedAccessOperations(source, 'reports.resolver.ts', authOperations, declaredGuards)

    expect(unauthorized.map((operation) => operation.className)).toEqual(['ReportsResolver'])
  })

  it('keeps caller-scoped operations out, as before', () => {
    expect(
      unauthorizedNames(`
        @Authenticated()
        @UseGuards(GqlAuthGuard)
        @Resolver()
        class MeResolver {
          @Query(() => Boolean)
          me(@CtxUser() user: User) {}
        }
      `),
    ).toEqual([])
  })
})
