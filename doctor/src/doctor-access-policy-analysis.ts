import ts from 'typescript'
import { hasCallerScope } from './doctor-operation-analysis'
import { calledAccessHelpers } from './doctor-inline-access'
import { hasAuthenticationGuard, type AuthOperation } from './doctor-auth-analysis'
import { declaredGuardsOn, type DeclaredGuards } from './doctor-declared-guards'
import { decoratorName, decoratorsOf, unwrapExpression } from './doctor-typescript-analysis'

export type AccessPolicyScope = 'platform' | 'organization' | 'public-api'

export type AccessPolicyDeclaration = {
  className: string
  decorator: string
  line: number
  name: string
  permissions: string[]
  scope: AccessPolicyScope
}

export type InlineAccessCheckViolation = {
  calls: string[]
  className: string
  line: number
  name: string
}

const graphqlOperationDecorators = new Set(['Mutation', 'Query', 'ResolveField', 'Subscription'])
const httpOperationDecorators = new Set(['All', 'Delete', 'Get', 'Head', 'Options', 'Patch', 'Post', 'Put', 'Sse'])
const policyDecorators = new Map<string, AccessPolicyScope>([
  ['RequirePlatformPermission', 'platform'],
  ['RequireAllPlatformPermissions', 'platform'],
  ['RequireOrganizationPermission', 'organization'],
  ['RequireAllOrganizationPermissions', 'organization'],
  ['RequirePublicApiScopes', 'public-api'],
  // Same policy, for a method whose class already authenticates -- generated CRUD. It declares a
  // permission exactly as the composing variant does; only the guard wiring differs.
  ['RequirePlatformPermissionUnderClassGuard', 'platform'],
])
/** Exposed so doctor-auth-analysis can assert it recognizes the same decorators. */
export const POLICY_DECORATOR_NAMES: readonly string[] = [...policyDecorators.keys()]

const methodName = (method: ts.MethodDeclaration, sourceFile: ts.SourceFile): string =>
  ts.isIdentifier(method.name) || ts.isStringLiteral(method.name) ? method.name.text : method.name.getText(sourceFile)

const isApiClass = (statement: ts.ClassDeclaration): boolean =>
  decoratorsOf(statement).some((decorator) => ['Controller', 'Resolver'].includes(decoratorName(decorator)))

const isApiOperation = (method: ts.MethodDeclaration): boolean =>
  decoratorsOf(method).some((decorator) => {
    const name = decoratorName(decorator)
    return graphqlOperationDecorators.has(name) || httpOperationDecorators.has(name)
  })

const stringLiterals = (node: ts.Node): string[] => {
  const values: string[] = []
  const visit = (current: ts.Node) => {
    if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
      values.push(current.text)
      return
    }
    ts.forEachChild(current, visit)
  }
  visit(node)
  return values
}

const permissionArguments = (decorator: ts.Decorator, scope: AccessPolicyScope): string[] => {
  if (!ts.isCallExpression(decorator.expression)) return []
  const args = decorator.expression.arguments
  if (scope === 'organization') return args[0] ? stringLiterals(args[0]) : []
  return args.flatMap((argument) => stringLiterals(argument))
}

const policyDeclarations = (
  decorators: readonly ts.Decorator[],
  sourceFile: ts.SourceFile,
  className: string,
  name: string,
): AccessPolicyDeclaration[] =>
  decorators.flatMap((decorator) => {
    const nameOfDecorator = decoratorName(decorator)
    const scope = policyDecorators.get(nameOfDecorator)
    if (!scope) return []
    return [
      {
        className,
        decorator: nameOfDecorator,
        line: sourceFile.getLineAndCharacterOfPosition(decorator.getStart(sourceFile)).line + 1,
        name,
        permissions: permissionArguments(decorator, scope),
        scope,
      },
    ]
  })

/** Read literal string properties only from one named top-level object-array declaration. */
export const readStringObjectArray = (
  source: string,
  variableName: string,
  properties: readonly string[],
): Array<Record<string, string>> => {
  const sourceFile = ts.createSourceFile('catalog.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

  // Find the array-literal declaration ANYWHERE in the tree, not only among top-level statements — a
  // repo may declare the catalog inside a function, module, or block. Require the
  // initializer to BE an array literal, so a same-named non-array binding (e.g.
  // `const permissions = buildPermissions()`) doesn't shadow the literal we actually want (#54 review).
  let initializer: ts.ArrayLiteralExpression | undefined
  const visit = (node: ts.Node): void => {
    if (initializer) return
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      const unwrapped = unwrapExpression(node.initializer)
      if (ts.isArrayLiteralExpression(unwrapped)) {
        initializer = unwrapped
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  if (!initializer) return []

  return initializer.elements.flatMap((element) => {
    const value = unwrapExpression(element)
    if (!ts.isObjectLiteralExpression(value)) return []
    const entry: Record<string, string> = {}
    for (const member of value.properties) {
      if (!ts.isPropertyAssignment(member)) continue
      const name = ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) ? member.name.text : ''
      if (!properties.includes(name)) continue
      const propertyValue = unwrapExpression(member.initializer)
      if (ts.isStringLiteral(propertyValue) || ts.isNoSubstitutionTemplateLiteral(propertyValue)) {
        entry[name] = propertyValue.text
      }
    }
    return properties.every((property) => entry[property]) ? [entry] : []
  })
}

export type UndeclaredAccessOperation = {
  className: string
  name: string
  line: number
  /** The operation takes the caller and scopes its data access to them. */
  callerScoped: boolean
}

const operationKey = (className: string, name: string): string => `${className}.${name}`

/**
 * Guarded API operations that declare no permission — neither on the method nor class-wide.
 *
 * Authentication says *someone* is calling; it never says *this* caller may do *this*. Many
 * operations legitimately need nothing more (anything acting on the caller's own row), but the
 * repo cannot tell "deliberately self-service" from "forgotten" unless every one of them is
 * written down. That is what this feeds: declare a permission, or record the exemption and why.
 *
 * Unauthenticated operations are out of scope — they are governed by the public-operations
 * allowlist, which already demands a reason for each.
 */
export const getUndeclaredAccessOperations = (
  source: string,
  fileName = 'source.ts',
  isGuarded: (operationName: string, className: string) => boolean = () => true,
): UndeclaredAccessOperation[] => {
  const { declarations, operations } = analyzeAccessPolicies(source, fileName)

  // Keyed by class as well as method: a file can hold several resolvers, and a permission declared
  // on one class's `list` (or class-wide on one class) says nothing about another class's `list`.
  // Keying by method name alone let one declaration hide an unrelated, undeclared endpoint.
  const classWide = new Set(
    declarations.filter((declaration) => declaration.name === '(class)').map((declaration) => declaration.className),
  )
  const declared = new Set(declarations.map((declaration) => operationKey(declaration.className, declaration.name)))

  return operations
    .filter(
      (operation) =>
        !classWide.has(operation.className) &&
        !declared.has(operationKey(operation.className, operation.name)) &&
        isGuarded(operation.name, operation.className),
    )
    .map((operation) => ({
      className: operation.className,
      name: operation.name,
      line: operation.line,
      callerScoped: operation.callerScoped,
    }))
}

/**
 * Authenticated operations nothing authorizes: no permission declared, no caller scoping, and no
 * repo-declared guard.
 *
 * A guard the repo declared in declared-guards.json counts as authorization here, applied by
 * `@UseGuards(...)` at the method or class level or through a composed decorator — `authOperations`
 * must come from `getAuthOperations` with the repo's composed decorators, so the three read the
 * same. An undeclared repo-local guard still proves only authentication, and still fails.
 */
export const getUnauthorizedAccessOperations = (
  source: string,
  fileName: string,
  authOperations: readonly AuthOperation[],
  declaredGuards: DeclaredGuards,
): UndeclaredAccessOperation[] => {
  // Joined on class and method, never method alone: two resolvers in one file can share a method
  // name, and a declared guard on one must not authorize the other.
  const guarded = new Set(
    authOperations
      .filter((operation) => hasAuthenticationGuard(operation))
      .map((operation) => operationKey(operation.className, operation.name)),
  )
  const behindDeclaredGuard = new Set(
    authOperations
      .filter((operation) => declaredGuardsOn(operation.guardNames, declaredGuards).length > 0)
      .map((operation) => operationKey(operation.className, operation.name)),
  )

  return getUndeclaredAccessOperations(source, fileName, (name, className) =>
    guarded.has(operationKey(className, name)),
  ).filter(
    (operation) =>
      !operation.callerScoped && !behindDeclaredGuard.has(operationKey(operation.className, operation.name)),
  )
}

export const analyzeAccessPolicies = (source: string, fileName = 'source.ts') => {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const declarations: AccessPolicyDeclaration[] = []
  const inlineViolations: InlineAccessCheckViolation[] = []
  const operations: UndeclaredAccessOperation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || !isApiClass(statement)) continue
    const className = statement.name?.text ?? '(anonymous class)'
    const classPolicies = policyDeclarations(decoratorsOf(statement), sourceFile, className, '(class)')
    declarations.push(...classPolicies)

    for (const member of statement.members) {
      if (!ts.isMethodDeclaration(member) || !isApiOperation(member)) continue
      const name = methodName(member, sourceFile)
      const methodPolicies = policyDeclarations(decoratorsOf(member), sourceFile, className, name)
      declarations.push(...methodPolicies)
      operations.push({
        className,
        name,
        line: sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile)).line + 1,
        callerScoped: hasCallerScope(member),
      })

      const calls = calledAccessHelpers(member)
      if (calls.length > 0 && classPolicies.length === 0 && methodPolicies.length === 0) {
        inlineViolations.push({
          calls,
          className,
          line: sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile)).line + 1,
          name,
        })
      }
    }
  }

  return { declarations, inlineViolations, operations }
}
