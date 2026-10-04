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
 * - Only the decorator a factory RETURNS counts. A `UseGuards(...)` call whose result is discarded
 *   applies nothing at runtime and is not credited; a conditional return credits only the guards
 *   every path applies, and a body that can return without a decorator credits none.
 * - A factory that returns another composed factory (a private helper, or one of the access
 *   policy decorators) inherits its guards, resolved across files.
 * - A name defined more than once with different guards resolves to the guards ALL definitions
 *   share. Picking the larger set could credit a route with a guard it does not have; the
 *   intersection can only under-credit, which reports rather than hides.
 * - The access-policy decorators keep their existing modelling and are not overridden here.
 */

/**
 * What a declaration's RETURNED decorator applies, given a way to resolve the factories it calls.
 * Evaluated lazily so delegation can be resolved across files once every definition is known.
 */
type ComposedDefinition = {
  evaluate: (resolve: (name: string) => ReadonlySet<string>) => Set<string>
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

const intersect = (sets: readonly ReadonlySet<string>[]): Set<string> => {
  if (sets.length === 0) return new Set()
  const [first, ...rest] = sets
  return new Set([...first].filter((guard) => rest.every((other) => other.has(guard))))
}

const unwrap = (expression: ts.Expression): ts.Expression => {
  let current = expression
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression
  }
  return current
}

/**
 * Guards a decorator EXPRESSION applies — only what ends up in the decorator, never a `UseGuards`
 * call made and discarded alongside it. A conditional applies only the guards both branches share;
 * anything else unrecognized (a spread, a local variable, an arbitrary call) applies none. Every
 * uncertainty resolves toward crediting fewer guards, which can only report, never hide.
 */
const evaluateDecorator = (node: ts.Expression, resolve: (name: string) => ReadonlySet<string>): Set<string> => {
  const expression = unwrap(node)

  if (ts.isConditionalExpression(expression)) {
    return intersect([
      evaluateDecorator(expression.whenTrue, resolve),
      evaluateDecorator(expression.whenFalse, resolve),
    ])
  }
  if (ts.isIdentifier(expression)) return new Set(resolve(expression.text))
  if (!ts.isCallExpression(expression)) return new Set()

  const name = calleeName(expression)
  if (name === 'UseGuards') return new Set(expression.arguments.flatMap((argument) => guardNamesIn(argument)))
  if (name === 'applyDecorators') {
    const guards = new Set<string>()
    for (const argument of expression.arguments) {
      if (ts.isSpreadElement(argument)) continue
      for (const guard of evaluateDecorator(argument, resolve)) guards.add(guard)
    }
    return guards
  }
  return name ? new Set(resolve(name)) : new Set()
}

/** Return statements of a function body, excluding those of functions nested inside it. */
const returnStatementsOf = (body: ts.Block): ts.ReturnStatement[] => {
  const returns: ts.ReturnStatement[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionLike(node)) return
    if (ts.isReturnStatement(node)) returns.push(node)
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(body, visit)
  return returns
}

/**
 * A function body applies the guards EVERY return path applies. A bare `return`, or a body that
 * can fall off the end without returning, contributes an empty path and so credits nothing.
 */
const evaluateBody = (body: ts.Block, resolve: (name: string) => ReadonlySet<string>): Set<string> => {
  const returns = returnStatementsOf(body)
  const last = body.statements[body.statements.length - 1]
  const mayFallThrough = !last || !ts.isReturnStatement(last)
  if (returns.length === 0 || mayFallThrough) return new Set()
  return intersect(
    returns.map((statement) => (statement.expression ? evaluateDecorator(statement.expression, resolve) : new Set())),
  )
}

const readDefinition = (initializer: ts.Node): ComposedDefinition => ({
  evaluate: (resolve) => {
    const node = ts.isExpression(initializer) ? unwrap(initializer) : initializer
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) {
      if (!node.body) return new Set()
      return ts.isBlock(node.body) ? evaluateBody(node.body, resolve) : evaluateDecorator(node.body, resolve)
    }
    // `const Staff = applyDecorators(...)`, applied as `@Staff`.
    return ts.isExpression(node) ? evaluateDecorator(node, resolve) : new Set()
  },
})

/** Top-level decorator-factory candidates in one file, keyed by declared name. */
export const getComposedGuardDefinitions = (
  source: string,
  fileName = 'source.ts',
): Map<string, ComposedDefinition> => {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const definitions = new Map<string, ComposedDefinition>()

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) {
      definitions.set(statement.name.text, readDefinition(statement))
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
    const shared = intersect(
      definitions.map((definition) => definition.evaluate((called) => resolve(called, nextVisiting))),
    )

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
 * Whether a file can hold a composed guard decorator on its own evidence: it uses the composition
 * machinery, or delegates to an access-policy decorator. A file that only delegates to a repo-local
 * composed factory carries neither — `discoverComposedGuardDecorators` finds those.
 */
export const mayDeclareComposedGuards = (source: string): boolean =>
  /\bapplyDecorators\b|\bUseGuards\b/.test(source) ||
  ACCESS_POLICY_DECORATOR_NAMES.some((name) => source.includes(name))

const mentionsAny = (source: string, names: readonly string[]): boolean =>
  names.some((name) => new RegExp(`(?<![\\w$])${name.replaceAll('$', '\\$')}(?![\\w$])`).test(source))

/**
 * Composed decorators across every candidate source, parsing only the files that can matter.
 *
 * Starts from the files that hold composition evidence themselves, then repeatedly adds files that
 * mention a decorator already discovered — a wrapper like `export const StaffOnly = () => BaseGuards()`
 * in a file of its own carries no seed name, and without this its routes would read as unguarded.
 * Stops when a pass discovers nothing new.
 */
export const discoverComposedGuardDecorators = (
  candidates: readonly ComposedGuardSource[],
): ComposedGuardDecorators => {
  const included = new Set(candidates.filter(({ source }) => mayDeclareComposedGuards(source)))
  let composed = getComposedGuardDecorators([...included])

  for (;;) {
    const names = [...composed.keys()]
    const added = candidates.filter((candidate) => !included.has(candidate) && mentionsAny(candidate.source, names))
    if (added.length === 0) return composed
    for (const candidate of added) included.add(candidate)
    composed = getComposedGuardDecorators([...included])
  }
}
