import ts from 'typescript'
import { decoratorName as getDecoratorName, decoratorsOf as getDecorators } from './doctor-typescript-analysis'

export type AuthOperationKind = 'graphql' | 'http'

export type AuthOperation = {
  authLevelDeclared: boolean
  classDecorators: string
  className: string
  decorators: string
  guardNames: string[]
  inheritsParentAuthorization: boolean
  kind: AuthOperationKind
  line: number
  name: string
}

const graphqlOperationDecorators = new Set(['Mutation', 'Query', 'ResolveField', 'Subscription'])

const httpOperationDecorators = new Set(['All', 'Delete', 'Get', 'Head', 'Options', 'Patch', 'Post', 'Put', 'Sse'])

// Must stay in step with policyDecorators in doctor-access-policy-analysis. Two checks disagreeing
// about whether a decorator declares authorization is worse than either rule being wrong: the same
// operation reads as declared to one and undeclared to the other, and whichever runs second looks
// like the broken one. The spec asserts they match.
const accessPolicyDecorators = new Set([
  'RequirePlatformPermission',
  'RequireAllPlatformPermissions',
  'RequireOrganizationPermission',
  'RequireAllOrganizationPermissions',
  'RequirePublicApiScopes',
  'RequirePlatformPermissionUnderClassGuard',
])
/** Exposed so the spec can assert this stays in step with the access-policy map. */
export const ACCESS_POLICY_DECORATOR_NAMES: readonly string[] = [...accessPolicyDecorators]

const authLevelDecorators = new Set(['Public', 'Authenticated', 'AdminOnly', ...accessPolicyDecorators])
const nonAuthGuardPattern = /Throttler|RateLimit/
const guardNamePattern = /^[A-Z]\w*Guard$/

const getDecoratorSource = (decorators: readonly ts.Decorator[], sourceFile: ts.SourceFile): string =>
  decorators.map((decorator) => decorator.getText(sourceFile)).join('\n')

const getClassKind = (decoratorNames: Set<string>): AuthOperationKind | undefined => {
  if (decoratorNames.has('Controller')) return 'http'
  if (decoratorNames.has('Resolver')) return 'graphql'
  return undefined
}

const isOperationDecorator = (name: string, kind: AuthOperationKind): boolean =>
  kind === 'http' ? httpOperationDecorators.has(name) : graphqlOperationDecorators.has(name)

const getMethodName = (method: ts.MethodDeclaration, sourceFile: ts.SourceFile): string => {
  if (ts.isIdentifier(method.name) || ts.isStringLiteral(method.name)) return method.name.text
  return method.name.getText(sourceFile)
}

const collectGuardNames = (node: ts.Node, guards: Set<string>) => {
  if (ts.isIdentifier(node) && guardNamePattern.test(node.text)) {
    guards.add(node.text)
  }
  ts.forEachChild(node, (child) => collectGuardNames(child, guards))
}

/**
 * Guard names written inside one `UseGuards(...)` argument list, normalized the way the guard
 * baseline records them: `AuthGuard('jwt')` reads as `AuthGuard`. Exposed so the composed-decorator
 * scan reads guards exactly as a literal call site is read — two normalizations would let the same
 * guard compare unequal to itself.
 */
export const guardNamesIn = (node: ts.Node): string[] => {
  const guards = new Set<string>()
  collectGuardNames(node, guards)
  return [...guards]
}

/** The guards each access-policy decorator applies, as `getAuthOperations` attributes them. */
export const ACCESS_POLICY_DECORATOR_GUARDS: readonly string[] = ['AccessPolicyGuard', 'GqlAuthGuard']

/**
 * Decorator name -> the guards it applies, for repo-local decorators that compose `UseGuards` with
 * `applyDecorators`. Built by `getComposedGuardDecorators`.
 */
export type ComposedGuardDecorators = ReadonlyMap<string, readonly string[]>

export type AuthOperationOptions = {
  composedGuards?: ComposedGuardDecorators
}

const getGuardNames = (
  decorators: readonly ts.Decorator[],
  composedGuards: ComposedGuardDecorators = new Map(),
): string[] => {
  const guards = new Set<string>()

  for (const decorator of decorators) {
    const decoratorName = getDecoratorName(decorator)
    if (accessPolicyDecorators.has(decoratorName)) {
      for (const guard of ACCESS_POLICY_DECORATOR_GUARDS) guards.add(guard)
      continue
    }
    // A decorator that applies its guards through applyDecorators enforces exactly what the same
    // guards written literally would, so it is read as if they were.
    const composed = composedGuards.get(decoratorName)
    if (composed) {
      for (const guard of composed) guards.add(guard)
      continue
    }
    if (decoratorName !== 'UseGuards') continue
    if (!ts.isCallExpression(decorator.expression)) continue

    for (const argument of decorator.expression.arguments) {
      collectGuardNames(argument, guards)
    }
  }

  return [...guards].sort((left, right) => left.localeCompare(right))
}

const hasAuthLevelDecorator = (decorators: readonly ts.Decorator[]): boolean =>
  decorators.some((decorator) => authLevelDecorators.has(getDecoratorName(decorator)))

export const isAuthenticationGuardName = (guard: string): boolean => !nonAuthGuardPattern.test(guard)

export const getGuardRank = (guards: string[]): number => {
  const authenticationGuards = guards.filter(isAuthenticationGuardName)
  if (authenticationGuards.includes('AccessPolicyGuard')) return 3
  if (authenticationGuards.includes('GqlAuthAdminGuard')) return 3
  if (authenticationGuards.some((guard) => guard.includes('Scoped') || guard.includes('Owner'))) {
    return 2
  }
  if (authenticationGuards.includes('GqlAuthGuard')) return 1
  return authenticationGuards.length > 0 ? 1 : 0
}

export const getOperationGuardNames = (operation: AuthOperation): string[] => operation.guardNames

export const hasAuthenticationGuard = (operation: AuthOperation): boolean =>
  operation.inheritsParentAuthorization || operation.guardNames.some(isAuthenticationGuardName)

export const declaresAuthLevel = (operation: AuthOperation): boolean => operation.authLevelDeclared

export const getAuthOperations = (
  source: string,
  fileName = 'source.ts',
  options: AuthOperationOptions = {},
): AuthOperation[] => {
  const { composedGuards } = options
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const operations: AuthOperation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement)) continue

    const classDecorators = getDecorators(statement)
    const classDecoratorNames = new Set(classDecorators.map(getDecoratorName))
    const kind = getClassKind(classDecoratorNames)
    if (!kind) continue

    const className = statement.name?.text ?? '(anonymous class)'
    const classDecoratorSource = getDecoratorSource(classDecorators, sourceFile)
    const classGuardNames = getGuardNames(classDecorators, composedGuards)
    const classDeclaresAuthLevel = hasAuthLevelDecorator(classDecorators)

    for (const member of statement.members) {
      if (!ts.isMethodDeclaration(member)) continue

      const methodDecorators = getDecorators(member)
      const methodDecoratorNames = new Set(methodDecorators.map(getDecoratorName))
      if (!methodDecorators.some((decorator) => isOperationDecorator(getDecoratorName(decorator), kind))) {
        continue
      }

      const inheritsParentAuthorization =
        kind === 'graphql' &&
        methodDecoratorNames.has('ResolveField') &&
        methodDecoratorNames.has('InheritedParentAuthorization')

      const line = sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile)).line + 1
      operations.push({
        authLevelDeclared:
          classDeclaresAuthLevel || hasAuthLevelDecorator(methodDecorators) || inheritsParentAuthorization,
        classDecorators: classDecoratorSource,
        className,
        decorators: getDecoratorSource(methodDecorators, sourceFile),
        guardNames: [...new Set([...classGuardNames, ...getGuardNames(methodDecorators, composedGuards)])].sort(
          (left, right) => left.localeCompare(right),
        ),
        inheritsParentAuthorization,
        kind,
        line,
        name: getMethodName(member, sourceFile),
      })
    }
  }

  return operations
}
