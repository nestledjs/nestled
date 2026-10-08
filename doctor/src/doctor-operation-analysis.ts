import ts from 'typescript'
import { decoratorName, decoratorsOf, unwrapExpression } from './doctor-typescript-analysis'

export const callName = (expression: ts.Expression): string => {
  const node = unwrapExpression(expression)
  if (ts.isIdentifier(node)) return node.text
  if (ts.isPropertyAccessExpression(node)) return node.name.text
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
    return node.argumentExpression.text
  }
  return ''
}

export const referencesBindings = (node: ts.Node, names: ReadonlySet<string>): boolean => {
  if (ts.isIdentifier(node) && names.has(node.text)) {
    const parent = node.parent
    if (parent && ts.isPropertyAccessExpression(parent) && parent.name === node) return false
    if (parent && ts.isPropertyAssignment(parent) && parent.name === node) return false
    return true
  }
  return ts.forEachChild(node, (child) => referencesBindings(child, names) || undefined) ?? false
}

const bindingNames = (name: ts.BindingName): string[] => {
  if (ts.isIdentifier(name)) return [name.text]
  return name.elements.flatMap((element) => (ts.isBindingElement(element) ? bindingNames(element.name) : []))
}

const parameterNames = (method: ts.MethodDeclaration, decorator: RegExp): Set<string> =>
  new Set(
    method.parameters.flatMap((parameter) =>
      decoratorsOf(parameter).some((item) => decorator.test(decoratorName(item))) ? bindingNames(parameter.name) : [],
    ),
  )

const propertyName = (name: ts.PropertyName): string =>
  ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : ''

const auditOrLogCall = (node: ts.CallExpression): boolean => {
  const callee = node.expression.getText()
  if (/\b(?:logger|Logger|console)\./.test(callee)) return true
  return (
    /audit|securityEvent/i.test(callee) &&
    /^(?:log|record|write|emit|append|create|audit|runInAudit)/i.test(callName(node.expression))
  )
}

const hasThrow = (node: ts.Node): boolean => {
  if (ts.isThrowStatement(node)) return true
  if (ts.isFunctionLike(node)) return false
  return ts.forEachChild(node, (child) => hasThrow(child) || undefined) ?? false
}

const scopeReference = (node: ts.Node, names: ReadonlySet<string>): boolean => {
  if (
    ts.isPropertyAssignment(node) &&
    /^(?:actor|actorId|actorUserId|performedBy|performedById)$/i.test(propertyName(node.name))
  )
    return false
  if (ts.isCallExpression(node) && auditOrLogCall(node)) return false
  if (ts.isIdentifier(node)) return referencesBindings(node, names)
  return ts.forEachChild(node, (child) => scopeReference(child, names) || undefined) ?? false
}

/** Injection alone is identity, not authorization. Look for its use outside audit attribution. */
export const hasCallerScope = (method: ts.MethodDeclaration): boolean => {
  if (decoratorsOf(method).some((item) => decoratorName(item) === 'InheritedParentAuthorization')) return true
  const names = parameterNames(method, /^Ctx[A-Za-z]*$/)
  if (!names.size || !method.body) return false
  const visit = (node: ts.Node): boolean => {
    if (ts.isVariableDeclaration(node) && node.initializer && scopeReference(node.initializer, names)) {
      bindingNames(node.name).forEach((name) => names.add(name))
    }
    if (
      ts.isIfStatement(node) &&
      scopeReference(node.expression, names) &&
      (hasThrow(node.thenStatement) || (node.elseStatement && hasThrow(node.elseStatement)))
    )
      return true
    if (ts.isCallExpression(node)) {
      if (auditOrLogCall(node)) return false
      return node.arguments.some((argument) => scopeReference(argument, names))
    }
    // A self-service resolver may return the authenticated principal directly.
    if (ts.isReturnStatement(node) && node.expression && !ts.isCallExpression(node.expression))
      return scopeReference(node.expression, names)
    return ts.forEachChild(node, (child) => visit(child) || undefined) ?? false
  }
  return visit(method.body)
}

const dataMethods = new Set([
  'findFirst',
  'findUnique',
  'findMany',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'create',
  'upsert',
  'count',
])

/** Only references to @Args bindings in data-access filters count; select/output names do not. */
export const hasCallerInputInDataAccess = (method: ts.MethodDeclaration): boolean => {
  const names = parameterNames(method, /^Args$/)
  if (!names.size || !method.body) return false
  // Follow local aliases, including a caller-provided where object passed to a Prisma operation.
  const aliases = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.initializer && referencesBindings(node.initializer, names)) {
      bindingNames(node.name).forEach((name) => names.add(name))
    }
    ts.forEachChild(node, aliases)
  }
  aliases(method.body)
  const visit = (node: ts.Node): boolean => {
    if (ts.isCallExpression(node) && dataMethods.has(callName(node.expression))) {
      const argument = node.arguments[0] && unwrapExpression(node.arguments[0])
      if (argument && ts.isObjectLiteralExpression(argument)) {
        for (const property of argument.properties) {
          if (
            ts.isPropertyAssignment(property) &&
            propertyName(property.name) === 'where' &&
            referencesBindings(property.initializer, names)
          )
            return true
          if (ts.isShorthandPropertyAssignment(property) && property.name.text === 'where' && names.has('where'))
            return true
        }
      }
    }
    return ts.forEachChild(node, (child) => visit(child) || undefined) ?? false
  }
  return visit(method.body)
}

export const resolverScopeFindings = (source: string): { name: string; line: number }[] => {
  const file = ts.createSourceFile('resolver.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const findings: { name: string; line: number }[] = []
  const visit = (node: ts.Node): void => {
    if (
      ts.isMethodDeclaration(node) &&
      decoratorsOf(node).some((item) => /^(Query|Mutation|Subscription|ResolveField)$/.test(decoratorName(item))) &&
      hasCallerInputInDataAccess(node) &&
      !hasCallerScope(node)
    ) {
      findings.push({
        name: node.name.getText(file),
        line: file.getLineAndCharacterOfPosition(node.name.getStart(file)).line + 1,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return findings
}

export const readApiPrefixes = (source: string): string[] | undefined => {
  const file = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let prefixes: string[] | undefined
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'VALID_API_PREFIXES' &&
      node.initializer
    ) {
      const value = unwrapExpression(node.initializer)
      if (ts.isArrayLiteralExpression(value) && value.elements.every(ts.isStringLiteralLike)) {
        prefixes = value.elements.map((element) => (element as ts.StringLiteralLike).text)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return prefixes
}

/** Word boundaries separate entry points from read helpers such as emulatedByOf/emulationStatus. */
export const isEmulationEntryName = (name: string): boolean =>
  /(?:^|[a-z])(?:Emulate|Impersonate)(?:$|[A-Z_])|^(?:emulate|impersonate)(?:$|[A-Z_])/.test(name)

export const callsEmulationEntry = (source: string): boolean => {
  const file = ts.createSourceFile('body.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) && isEmulationEntryName(callName(node.expression))) ||
    (ts.forEachChild(node, (child) => visit(child) || undefined) ?? false)
  return visit(file)
}

export const declaresEmulationEntry = (source: string): boolean => {
  const file = ts.createSourceFile('service.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const visit = (node: ts.Node): boolean =>
    (ts.isMethodDeclaration(node) && isEmulationEntryName(propertyName(node.name))) ||
    (ts.forEachChild(node, (child) => visit(child) || undefined) ?? false)
  return visit(file)
}
