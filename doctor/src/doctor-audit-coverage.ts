import ts from 'typescript'

/**
 * Words that mark an audit or security-event write. `audit` counts as any part of an identifier, so
 * project helpers such as `recordBillingAuditLog`, `runInAuditTransaction`, `this.auditService` or a
 * `programApplicationAudit` model are recognised: `audit`/`AUDIT` at the start of a name or after `_`,
 * or `Audit` as a later camel-case segment. Case-sensitive on purpose, so a word that merely
 * contains the letters (`plaudit`, `PLAUDIT`, `PLaudit`) does not count.
 */
const auditIdentifier = (name: string): boolean =>
  /^(?:audit|AUDIT|securityEvent|SECURITY_EVENT)|_audit|_AUDIT|Audit|SecurityEvent/.test(name)

/** Only syntax identifiers count, never prose in comments, strings, or template-literal text. */
export const hasAuditMarker = (source: string, auditModels: readonly string[] = []): boolean => {
  const file = ts.createSourceFile('body.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const models = new Set(auditModels)
  const visit = (node: ts.Node): boolean => {
    if (ts.isIdentifier(node) && auditIdentifier(node.text)) return true
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const call = node.expression
      if (
        ['create', 'createMany', 'createManyAndReturn'].includes(call.name.text) &&
        ts.isPropertyAccessExpression(call.expression) &&
        models.has(call.expression.name.text)
      )
        return true
    }
    return ts.forEachChild(node, (child) => visit(child) || undefined) ?? false
  }
  return visit(file)
}

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
const callsIn = (body: string): { field?: string; method: string }[] => {
  const file = ts.createSourceFile('body.ts', body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const calls: { field?: string; method: string }[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const callee = node.expression
      if (callee.expression.kind === ts.SyntaxKind.ThisKeyword) calls.push({ method: callee.name.text })
      if (
        ts.isPropertyAccessExpression(callee.expression) &&
        callee.expression.expression.kind === ts.SyntaxKind.ThisKeyword
      ) {
        calls.push({ field: callee.expression.name.text, method: callee.name.text })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return calls
}

/**
 * Mutations in a resolver file that write no audit record, judged per operation. A mutation counts
 * as audited when its own body has an audit marker, or a method it calls does. A call is followed
 * only to the method it actually reaches, with cycle protection:
 *
 *   - `this.helper(...)` -> `helper` on the same class;
 *   - `this.orders.update(...)` -> `update` on the class `orders` is typed as (constructor
 *     injection or a typed field), found among the resolver file and its sibling services.
 *
 * A call whose target can't be resolved that way is not followed, so it can't certify anything: a
 * mutation calling `this.orders.update()` is not audited because some other service has an audited
 * `update()`. An audit call elsewhere in the file or service never counts either.
 *
 * Comments and string literal text never count as audit evidence.
 */
export const unauditedMutations = (
  resolverSource: string,
  serviceSources: string[],
  auditModels: readonly string[] = [],
): { name: string; line: number }[] => {
  const resolverClasses = readClasses(resolverSource)
  const classes = new Map(resolverClasses)
  for (const source of serviceSources) {
    for (const [name, info] of readClasses(source)) if (!classes.has(name)) classes.set(name, info)
  }

  const audits = (className: string, body: string): boolean => {
    const pending = [{ className, body }]
    const seen = new Set<string>()
    while (pending.length) {
      const current = pending.pop()
      if (!current) break
      if (hasAuditMarker(current.body, auditModels)) return true
      const owner = classes.get(current.className)
      if (!owner) continue
      for (const { field, method } of callsIn(current.body)) {
        const targetClass = field === undefined ? current.className : owner.fields.get(field)
        if (!targetClass) continue
        const key = `${targetClass}.${method}`
        if (seen.has(key)) continue
        seen.add(key)
        for (const callee of classes.get(targetClass)?.methods.get(method) ?? []) {
          pending.push({ className: targetClass, body: callee })
        }
      }
    }
    return false
  }

  const unaudited: { name: string; line: number }[] = []
  for (const [className, info] of resolverClasses) {
    for (const mutation of info.mutations) {
      if (!audits(className, mutation.body)) {
        unaudited.push({ name: mutation.name, line: mutation.line })
      }
    }
  }
  return unaudited.sort((left, right) => left.line - right.line)
}
