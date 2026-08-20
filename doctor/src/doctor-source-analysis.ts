import ts from 'typescript'

/**
 * Module specifiers a file imports from outside itself — relative siblings excluded.
 *
 * Read from the AST rather than by regex: an import specifier is a string literal, so any scan that
 * blanks strings to avoid comment false-positives blanks the very thing being inspected.
 */
export const getExternalImportSpecifiers = (source: string, fileName = 'source.ts'): string[] => {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const specifiers: string[] = []

  const record = (node: ts.Expression | undefined): void => {
    if (!node || !ts.isStringLiteralLike(node)) return
    if (node.text.startsWith('.')) return
    specifiers.push(node.text)
  }

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      record(node.moduleSpecifier)
    } else if (ts.isImportEqualsDeclaration(node)) {
      // `import x = require('…')`. A static external import that looks nothing like one, and the
      // only import form that reaches a module without an ImportDeclaration or a CallExpression —
      // so a scan built from those two alone lets it through silently.
      if (ts.isExternalModuleReference(node.moduleReference))
        record(node.moduleReference.expression)
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      record(node.arguments[0])
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return [...new Set(specifiers)].sort((left, right) => left.localeCompare(right))
}

export type GraphqlOperationMethod = {
  /** The method's own decorators, verbatim. */
  decorators: string
  name: string
  /** The method body, braces included. Empty for an overload or abstract signature. */
  body: string
  /** The ENTIRE method — decorators, signature, parameters and body. */
  text: string
  line: number
}

/**
 * GraphQL operation methods, read from the AST.
 *
 * The previous line-scanning version located a method's body by taking the first `{` after the
 * declaration line, which for any method with an object literal in its parameters —
 * `@Args('id', { type: () => String })` — captured THAT literal as the body. Callers then tested
 * the wrong text, and the resolver-scope check skipped almost every operation as a result.
 *
 * `text` exists because parameter decorators (`@CtxUser()`) live in the signature: they appear in
 * neither `decorators` nor `body`, so any caller reasoning about the caller-scope of an operation
 * has to look at the whole method.
 */
export const getGraphqlOperationMethods = (source: string): GraphqlOperationMethod[] => {
  const sourceFile = ts.createSourceFile(
    'operation.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const methods: GraphqlOperationMethod[] = []

  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node)) {
      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member) || !member.name) continue

        const decorators = (ts.getDecorators(member) ?? [])
          .map(decorator => decorator.getText(sourceFile))
          .join('\n')
        if (!/@(?:Query|Mutation|Subscription|ResolveField)\b/.test(decorators)) continue

        methods.push({
          decorators,
          name: member.name.getText(sourceFile),
          body: member.body ? member.body.getText(sourceFile) : '',
          text: member.getText(sourceFile),
          line: sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile)).line + 1,
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return methods
}

const startsWithBlockComment = (source: string, index: number): boolean =>
  source[index] === '/' && source[index + 1] === '*'

const startsWithLineComment = (
  source: string,
  index: number,
  onlyWhitespaceOnLine: boolean,
): boolean => onlyWhitespaceOnLine && source[index] === '/' && source[index + 1] === '/'

const skipBlockComment = (
  source: string,
  startIndex: number,
): { index: number; preservedNewlines: string } => {
  let index = startIndex + 2
  let preservedNewlines = ''

  while (index < source.length) {
    if (source[index] === '\n') {
      preservedNewlines += '\n'
      index += 1
    } else if (source[index] === '*' && source[index + 1] === '/') {
      index += 2
      break
    } else {
      index += 1
    }
  }

  return { index, preservedNewlines }
}

const skipLineComment = (source: string, startIndex: number): number => {
  let index = startIndex
  while (index < source.length && source[index] !== '\n') {
    index += 1
  }
  return index
}

const skipStringLiteral = (source: string, startIndex: number): number => {
  const quote = source[startIndex]
  let index = startIndex + 1

  while (index < source.length) {
    const current = source[index]
    if (current === '\\') {
      index += 2
      continue
    }
    if (current === quote) return index + 1
    index += 1
  }

  return index
}

const updateWhitespaceState = (current: string, onlyWhitespaceOnLine: boolean): boolean => {
  if (current === '\n') return true
  if (current === ' ' || current === '\t' || current === '\r') return onlyWhitespaceOnLine
  return false
}

/**
 * End index (exclusive) of a template literal, following `${…}` interpolations — including
 * strings and NESTED template literals inside them. `skipStringLiteral` stops at the first
 * unescaped backtick, which for `` `a ${flag ? `b` : ''} c` `` is the NESTED opener, leaving the
 * tail parsed as code — so backticks need their own scanner.
 */
const skipTemplateLiteral = (source: string, startIndex: number): number => {
  let index = startIndex + 1
  while (index < source.length) {
    const current = source[index]
    if (current === '\\') {
      index += 2
      continue
    }
    if (current === '`') return index + 1
    if (current === '$' && source[index + 1] === '{') {
      index = skipInterpolation(source, index + 2)
      continue
    }
    index += 1
  }
  return index
}

/** End index (exclusive) of a `${…}` interpolation body, starting just after the `${`. */
const skipInterpolation = (source: string, startIndex: number): number => {
  let depth = 1
  let index = startIndex
  while (index < source.length && depth > 0) {
    const current = source[index]
    if (current === '\\') {
      index += 2
      continue
    }
    if (current === '`') {
      index = skipTemplateLiteral(source, index)
      continue
    }
    if (current === "'" || current === '"') {
      index = skipStringLiteral(source, index)
      continue
    }
    if (current === '{') depth += 1
    else if (current === '}') depth -= 1
    index += 1
  }
  return index
}

/**
 * Blank comments AND string-literal contents while preserving every byte offset, for scans that
 * must match only CODE. `stripComments` deliberately keeps trailing `//` comments (a `//` later
 * on a code line can live inside a regex literal) and keeps strings — right for structural scans,
 * wrong for token scans like the `as any` gate, which flagged the prose "the same two locks as
 * any other write" in a comment. Blanking instead of deleting keeps `getLineNumber` valid against
 * the original source. The trade-offs are deliberate: an unescaped `//` inside a regex character
 * class blanks the rest of that line, and code inside a template-literal `${…}` is blanked with
 * the string — both vanishingly rare in product source, and both fail toward NOT flagging.
 */
export const blankCommentsAndStrings = (source: string): string => {
  const out = source.split('')
  const blank = (from: number, to: number): void => {
    for (let position = from; position < to; position += 1) {
      if (out[position] !== '\n') out[position] = ' '
    }
  }

  let index = 0
  while (index < source.length) {
    if (startsWithBlockComment(source, index)) {
      const end = skipBlockComment(source, index).index
      blank(index, end)
      index = end
    } else if (source[index] === '/' && source[index + 1] === '/') {
      const start = index
      while (index < source.length && source[index] !== '\n') index += 1
      blank(start, index)
    } else if (source[index] === "'" || source[index] === '"') {
      const end = skipStringLiteral(source, index)
      blank(index, end)
      index = end
    } else if (source[index] === '`') {
      const end = skipTemplateLiteral(source, index)
      blank(index, end)
      index = end
    } else {
      index += 1
    }
  }

  return out.join('')
}

/**
 * Remove comments before Doctor's lightweight source scans without mistaking comment-like text in
 * string literals for comments. Newlines inside block comments are retained so diagnostics keep
 * their original source line numbers.
 */
export const stripComments = (source: string): string => {
  let output = ''
  let index = 0
  let onlyWhitespaceOnLine = true

  while (index < source.length) {
    if (startsWithBlockComment(source, index)) {
      const skipped = skipBlockComment(source, index)
      output += skipped.preservedNewlines
      onlyWhitespaceOnLine = skipped.preservedNewlines.length > 0 || onlyWhitespaceOnLine
      index = skipped.index
    } else if (startsWithLineComment(source, index, onlyWhitespaceOnLine)) {
      index = skipLineComment(source, index)
    } else if (source[index] === "'" || source[index] === '"' || source[index] === '`') {
      const end = skipStringLiteral(source, index)
      output += source.slice(index, end)
      onlyWhitespaceOnLine = false
      index = end
    } else {
      output += source[index]
      onlyWhitespaceOnLine = updateWhitespaceState(source[index], onlyWhitespaceOnLine)
      index += 1
    }
  }

  return output
}
