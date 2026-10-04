import ts from 'typescript'
import { getGraphqlOperationMethods } from './doctor-source-analysis'

/** Words that mark an audit or security-event write. */
export const hasAuditMarker = (source: string): boolean =>
  /\baudit(?:Log)?\b|recordAuditLog|SecurityEvent|securityEvent/i.test(source)

/** Bodies of every method of every class in a source file, keyed by method name. */
export const classMethodBodies = (source: string): Map<string, string[]> => {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const bodies = new Map<string, string[]>()
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node)) {
      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member) || !member.name || !member.body) continue
        const name = member.name.getText(sourceFile)
        bodies.set(name, [...(bodies.get(name) ?? []), member.body.getText(sourceFile)])
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return bodies
}

/** Names of methods called as `this.method(` or `this.field.method(` in a body. */
const calledMethods = (body: string): string[] => [
  ...new Set([...body.matchAll(/\bthis\.(?:\w+\.)?(\w+)\s*\(/g)].map((match) => match[1])),
]

const MAX_CALL_DEPTH = 3

/**
 * Mutations in a resolver file that write no audit record, judged per operation. A mutation counts
 * as audited when its own body has an audit marker, or a method it calls does: a method of the same
 * class, or of a service in `serviceSources`, followed up to three calls deep. An audit call
 * elsewhere in the file or service no longer counts: that was how one audited mutation certified
 * every other mutation sharing its file.
 *
 * Sources should already have comments stripped, so a marker in a comment doesn't count.
 */
export const unauditedMutations = (
  resolverSource: string,
  serviceSources: string[],
): { name: string; line: number }[] => {
  const local = classMethodBodies(resolverSource)
  const services = new Map<string, string[]>()
  for (const source of serviceSources) {
    for (const [name, bodies] of classMethodBodies(source))
      services.set(name, [...(services.get(name) ?? []), ...bodies])
  }

  const audits = (body: string, depth: number, seen: Set<string>): boolean => {
    if (hasAuditMarker(body)) return true
    if (depth === 0) return false
    for (const name of calledMethods(body)) {
      if (seen.has(name)) continue
      seen.add(name)
      const bodies = [...(local.get(name) ?? []), ...(services.get(name) ?? [])]
      if (bodies.some((callee) => audits(callee, depth - 1, seen))) return true
    }
    return false
  }

  return getGraphqlOperationMethods(resolverSource)
    .filter((operation) => /@Mutation\b/.test(operation.decorators))
    .filter((operation) => !audits(operation.body, MAX_CALL_DEPTH, new Set()))
    .map((operation) => ({ name: operation.name, line: operation.line }))
}
