import ts from 'typescript'
import { callName, referencesBindings } from './doctor-operation-analysis'

const assertions = new Set(['assertPermission', 'requirePermission'])
const predicates = new Set(['hasAnyPermissionInNamespace', 'hasPermission'])

const predicateCalls = (node: ts.Node): Set<string> => {
  const result = new Set<string>()
  const visit = (child: ts.Node): void => {
    if (ts.isCallExpression(child) && predicates.has(callName(child.expression))) result.add(callName(child.expression))
    ts.forEachChild(child, visit)
  }
  visit(node)
  return result
}

const denies = (node: ts.Node): boolean => {
  if (ts.isThrowStatement(node)) return true
  if (ts.isReturnStatement(node)) {
    return !node.expression || [ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.expression.kind)
  }
  // A throw inside an unrelated callback does not terminate the operation.
  if (ts.isFunctionLike(node)) return false
  return ts.forEachChild(node, (child) => denies(child) || undefined) ?? false
}

/** Boolean permission probes used to widen row scope do not gate access to the operation. */
export const calledAccessHelpers = (method: ts.MethodDeclaration): string[] => {
  if (!method.body) return []
  const calls = new Set<string>()
  const aliases = new Map<string, Set<string>>()
  const helpersIn = (node: ts.Node): Set<string> => {
    const helpers = predicateCalls(node)
    for (const [name, names] of aliases) {
      if (referencesBindings(node, new Set([name]))) names.forEach((helper) => helpers.add(helper))
    }
    return helpers
  }
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && assertions.has(callName(node.expression))) calls.add(callName(node.expression))
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      aliases.set(node.name.text, helpersIn(node.initializer))
    }
    if (ts.isIfStatement(node) && (denies(node.thenStatement) || (node.elseStatement && denies(node.elseStatement)))) {
      helpersIn(node.expression).forEach((helper) => calls.add(helper))
    }
    ts.forEachChild(node, visit)
  }
  visit(method.body)
  return [...calls].sort((left, right) => left.localeCompare(right))
}
