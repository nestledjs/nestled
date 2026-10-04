import ts from 'typescript'

/** Words that mark an audit or security-event write. */
export const hasAuditMarker = (source: string): boolean =>
  /\baudit(?:Log)?\b|recordAuditLog|SecurityEvent|securityEvent/i.test(source)

interface ClassInfo {
  /** Injected or declared fields and the class they are typed as, e.g. `orders` -> `OrdersService`. */
  fields: Map<string, string>
  /** Method bodies by name (overloads keep every body). */
  methods: Map<string, string[]>
  /** Mutation methods, in source order. */
  mutations: { name: string; line: number; body: string }[]
}

const typeNameOf = (type: ts.TypeNode | undefined, sourceFile: ts.SourceFile): string | undefined =>
  type && ts.isTypeReferenceNode(type) ? type.typeName.getText(sourceFile) : undefined

/** Every class in a source file: its typed fields, its method bodies and its @Mutation methods. */
export const readClasses = (source: string): Map<string, ClassInfo> => {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const classes = new Map<string, ClassInfo>()
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) && node.name) {
      const info: ClassInfo = { fields: new Map(), methods: new Map(), mutations: [] }
      for (const member of node.members) {
        if (ts.isConstructorDeclaration(member)) {
          // Constructor injection: `private readonly orders: OrdersService`.
          for (const parameter of member.parameters) {
            const type = typeNameOf(parameter.type, sourceFile)
            if (type && ts.isIdentifier(parameter.name)) info.fields.set(parameter.name.text, type)
          }
        } else if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
          const type = typeNameOf(member.type, sourceFile)
          if (type) info.fields.set(member.name.text, type)
        } else if (ts.isMethodDeclaration(member) && member.name && member.body) {
          const name = member.name.getText(sourceFile)
          const body = member.body.getText(sourceFile)
          info.methods.set(name, [...(info.methods.get(name) ?? []), body])
          const decorators = (ts.getDecorators(member) ?? [])
            .map((decorator) => decorator.getText(sourceFile))
            .join('\n')
          if (/@Mutation\b/.test(decorators)) {
            info.mutations.push({
              name,
              body,
              line: sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile)).line + 1,
            })
          }
        }
      }
      classes.set(node.name.text, info)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return classes
}

/** Calls in a body: `this.method(` (field undefined) and `this.field.method(`. */
const callsIn = (body: string): { field?: string; method: string }[] =>
  [...body.matchAll(/\bthis\.(?:(\w+)\.)?(\w+)\s*\(/g)].map((match) => ({ field: match[1], method: match[2] }))

const MAX_CALL_DEPTH = 3

/**
 * Mutations in a resolver file that write no audit record, judged per operation. A mutation counts
 * as audited when its own body has an audit marker, or a method it calls does. A call is followed
 * only to the method it actually reaches, up to three calls deep:
 *
 *   - `this.helper(...)` -> `helper` on the same class;
 *   - `this.orders.update(...)` -> `update` on the class `orders` is typed as (constructor
 *     injection or a typed field), found among the resolver file and its sibling services.
 *
 * A call whose target can't be resolved that way is not followed, so it can't certify anything: a
 * mutation calling `this.orders.update()` is not audited because some other service has an audited
 * `update()`. An audit call elsewhere in the file or service never counts either.
 *
 * Sources should already have comments stripped, so a marker in a comment doesn't count.
 */
export const unauditedMutations = (
  resolverSource: string,
  serviceSources: string[],
): { name: string; line: number }[] => {
  const resolverClasses = readClasses(resolverSource)
  const classes = new Map(resolverClasses)
  for (const source of serviceSources) {
    for (const [name, info] of readClasses(source)) if (!classes.has(name)) classes.set(name, info)
  }

  const audits = (className: string, body: string, depth: number, seen: Set<string>): boolean => {
    if (hasAuditMarker(body)) return true
    if (depth === 0) return false
    const owner = classes.get(className)
    if (!owner) return false
    for (const { field, method } of callsIn(body)) {
      const targetClass = field === undefined ? className : owner.fields.get(field)
      if (!targetClass) continue
      const key = `${targetClass}.${method}`
      if (seen.has(key)) continue
      seen.add(key)
      const bodies = classes.get(targetClass)?.methods.get(method) ?? []
      if (bodies.some((callee) => audits(targetClass, callee, depth - 1, seen))) return true
    }
    return false
  }

  const unaudited: { name: string; line: number }[] = []
  for (const [className, info] of resolverClasses) {
    for (const mutation of info.mutations) {
      if (!audits(className, mutation.body, MAX_CALL_DEPTH, new Set())) {
        unaudited.push({ name: mutation.name, line: mutation.line })
      }
    }
  }
  return unaudited.sort((left, right) => left.line - right.line)
}
