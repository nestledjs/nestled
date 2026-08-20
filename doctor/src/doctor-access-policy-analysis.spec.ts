import { describe, expect, it } from 'vitest'
import {
  getUndeclaredAccessOperations,
  analyzeAccessPolicies,
  readStringObjectArray,
} from './doctor-access-policy-analysis'

describe('analyzeAccessPolicies', () => {
  it('extracts platform and organization permission literals without option prose', () => {
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
      }
    `)

    expect(report.declarations.map(item => item.permissions)).toEqual([
      ['platform.users.read', 'platform.users.manage'],
      ['member:update'],
    ])
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

  it('finds the catalog when it is declared inside a function rather than at the top level (#120)', () => {
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

    expect(undeclared.map(operation => operation.name)).toEqual(['getSignedUrl'])
    expect(undeclared[0].callerScoped).toBe(false)
  })

  // @CtxUser() is a PARAMETER decorator, so detection has to read the whole method — a scan of the
  // method's own decorators, or of its body alone, misses it.
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
