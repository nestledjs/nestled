import ts from 'typescript'
import {
  ACCESS_POLICY_DECORATOR_GUARDS,
  ACCESS_POLICY_DECORATOR_NAMES,
  guardNamesIn,
  type ComposedGuardDecorators,
} from './doctor-auth-analysis'

/**
 * Repo-local decorators that apply guards through composition, e.g.
 *
 *   export const RequireStaffOnRestRoute = (...permissions: string[]) =>
 *     applyDecorators(SetMetadata(POLICY_KEY, permissions), UseGuards(AuthGuard('jwt'), PolicyGuard))
 *
 * The guard checks read `@UseGuards(...)` at the call site. Without this, a route moved onto a
 * decorator like the one above reads as having lost every guard — "downgraded from AuthGuard to
 * none" — while enforcement is unchanged or stricter. The only ways to silence that were to
 * baseline the route to `[]` (which records "no guard belongs here", so a real removal later
 * passes silently) or to stop composing guards, which is ordinary Nest practice and also the
 * safest way to fix guard ORDER: two separate `UseGuards` decorators apply bottom-up and append, so
 * the wrong stacking 401s every caller.
 *
 * So the composition is resolved instead: the decorator's guards are attributed to every operation
 * it decorates, method- or class-level, exactly as literal guards are. A route that genuinely loses
 * its guards still loses them here too.
 *
 * Deliberately static and conservative:
 * - Only top-level declarations are read: `const X = (...) => applyDecorators(...)`,
 *   `const X = applyDecorators(...)`, and `function X() { return applyDecorators(...) }`.
 * - A factory that delegates to another composed factory (a private helper, or one of the access
 *   policy decorators) inherits its guards, resolved across files.
 * - A name defined more than once with different guards resolves to the guards ALL definitions
 *   share. Picking the larger set could credit a route with a guard it does not have; the
 *   intersection can only under-credit, which reports rather than hides.
 * - The access-policy decorators keep their existing modelling and are not overridden here.
 */

type ComposedDefinition = {
  /** Guards the declaration applies directly, through `UseGuards(...)` anywhere in its body. */
  guards: Set<string>
  /** Every function the declaration calls by name — candidates for delegated composition. */
  calls: Set<string>
}

export type ComposedGuardSource = {
  file: string
  source: string
}

const accessPolicyDecoratorNames = new Set(ACCESS_POLICY_DECORATOR_NAMES)

// Names that are the composition machinery itself, never a decorator a route applies.
const reservedNames = new Set(['UseGuards', 'applyDecorators'])

const calleeName = (call: ts.CallExpression): string => {
  const expression = call.expression
  if (ts.isIdentifier(expression)) return expression.text
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text
  return ''
}

const readDefinition = (body: ts.Node): ComposedDefinition => {
  const definition: ComposedDefinition = { guards: new Set(), calls: new Set() }

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node)
      if (name === 'UseGuards') {
        for (const argument of node.arguments) {
          for (const guard of guardNamesIn(argument)) definition.guards.add(guard)
        }
      } else if (name) {
        definition.calls.add(name)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(body)

  return definition
}

/** Top-level decorator-factory candidates in one file, keyed by declared name. */
export const getComposedGuardDefinitions = (
  source: string,
  fileName = 'source.ts',
): Map<string, ComposedDefinition> => {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const definitions = new Map<string, ComposedDefinition>()

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) {
      definitions.set(statement.name.text, readDefinition(statement.body))
      continue
    }
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue
      definitions.set(declaration.name.text, readDefinition(declaration.initializer))
    }
  }

  return definitions
}

/**
 * Build decorator name -> guards across the given sources, resolving delegation between factories.
 * Only declarations that end up applying at least one guard are returned.
 */
export const getComposedGuardDecorators = (sources: readonly ComposedGuardSource[]): ComposedGuardDecorators => {
  const definitionsByName = new Map<string, ComposedDefinition[]>()
  for (const { file, source } of sources) {
    for (const [name, definition] of getComposedGuardDefinitions(source, file)) {
      definitionsByName.set(name, [...(definitionsByName.get(name) ?? []), definition])
    }
  }

  const resolved = new Map<string, Set<string>>()

  const resolve = (name: string, visiting: Set<string>): Set<string> => {
    if (accessPolicyDecoratorNames.has(name)) return new Set(ACCESS_POLICY_DECORATOR_GUARDS)
    const cached = resolved.get(name)
    if (cached) return cached
    const definitions = definitionsByName.get(name)
    // A cycle contributes nothing rather than recursing forever; neither side of it can be credited
    // with guards it only "has" by referring to itself.
    if (!definitions || visiting.has(name)) return new Set()

    const nextVisiting = new Set(visiting).add(name)
    const perDefinition = definitions.map((definition) => {
      const guards = new Set(definition.guards)
      for (const called of definition.calls) {
        for (const guard of resolve(called, nextVisiting)) guards.add(guard)
      }
      return guards
    })
    const [first, ...rest] = perDefinition
    const shared = new Set([...first].filter((guard) => rest.every((guards) => guards.has(guard))))

    // Cache only results computed outside a cycle: one computed mid-cycle saw a truncated view.
    if (visiting.size === 0) resolved.set(name, shared)
    return shared
  }

  const composed = new Map<string, readonly string[]>()
  for (const name of definitionsByName.keys()) {
    if (accessPolicyDecoratorNames.has(name) || reservedNames.has(name)) continue
    const guards = resolve(name, new Set())
    if (guards.size === 0) continue
    composed.set(
      name,
      [...guards].sort((left, right) => left.localeCompare(right)),
    )
  }

  return composed
}

/**
 * Whether a file can hold a composed guard decorator, so the scan parses only those. Matches the
 * composition machinery and the access-policy decorators a wrapper might delegate to.
 */
export const mayDeclareComposedGuards = (source: string): boolean =>
  /\bapplyDecorators\b|\bUseGuards\b/.test(source) ||
  ACCESS_POLICY_DECORATOR_NAMES.some((name) => source.includes(name))
