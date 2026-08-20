import { describe, expect, it } from 'vitest'
import {
  blankCommentsAndStrings,
  getExternalImportSpecifiers,
  stripComments,
  getGraphqlOperationMethods,
} from './doctor-source-analysis'

describe('stripComments', () => {
  it('preserves comment openers inside string literals', () => {
    const source = [
      "route('checkouts/cn/:token/*', './routes/checkout.tsx')",
      'const url = "https://example.com/path"',
      'const pattern = `expand/*`',
      "const escaped = 'it\\'s still /* text */'",
    ].join('\n')

    expect(stripComments(source)).toBe(source)
  })

  it('removes actual comments while preserving block-comment line positions', () => {
    const source = [
      'const before = true',
      '/* hidden',
      'across lines */',
      '  // hidden line',
      'const after = true',
    ].join('\n')

    const stripped = stripComments(source)

    expect(stripped).not.toContain('hidden')
    expect(stripped).toContain('const before = true')
    expect(stripped).toContain('const after = true')
    expect(stripped.split('\n')).toHaveLength(source.split('\n').length)
  })
})

describe('blankCommentsAndStrings', () => {
  it('blanks prose in comments so token scans match only code', () => {
    // The false positive that motivated this: "…the same two locks as any other write" in a
    // comment flagged the `as any` gate.
    const source = [
      'const value = compute() as any',
      '// takes the same two locks as any other write',
      'await write() // holds them as any caller would',
      '/** treat this as any other helper */',
      "const message = 'never cast as any'",
    ].join('\n')

    const blanked = blankCommentsAndStrings(source)

    expect(blanked.split('\n')[0]).toContain('as any')
    expect([...blanked.matchAll(/\bas\s+any\b/g)]).toHaveLength(1)
  })

  it('preserves every byte offset and line count', () => {
    const source = 'const a = 1 // note\nconst b = "text" as const\n/* block */ const c = 2\n'
    const blanked = blankCommentsAndStrings(source)

    expect(blanked).toHaveLength(source.length)
    expect(blanked.split('\n')).toHaveLength(source.split('\n').length)
    expect(blanked.indexOf('const c')).toBe(source.indexOf('const c'))
  })

  it('does not treat comment openers inside strings as comments', () => {
    const source = 'const url = "https://example.com" as any'
    const blanked = blankCommentsAndStrings(source)

    // The string is blanked, but the code after it survives — a // inside a string must not
    // swallow the rest of the line.
    expect(blanked).toContain('as any')
  })

  it('follows a template literal through interpolations with nested templates', () => {
    // skipStringLiteral stops at the FIRST backtick — for a nested template that is the nested
    // opener, and the outer tail would be parsed as code. "as any" prose in that tail must stay
    // blanked, and real code after the closing backtick must survive.
    const source =
      'const label = `use ${flag ? `nested` : "plain"} as any other tag`\nconst cast = value as any'
    const blanked = blankCommentsAndStrings(source)

    expect([...blanked.matchAll(/\bas\s+any\b/g)]).toHaveLength(1)
    expect(blanked.split('\n')[1]).toContain('as any')
    expect(blanked).toHaveLength(source.length)
  })

  it('tracks braces inside interpolations so an object literal does not end the template early', () => {
    const source =
      'const text = `count ${format({ max: 3 })} as any left` as const\nconst after = compute() as any'
    const blanked = blankCommentsAndStrings(source)

    expect([...blanked.matchAll(/\bas\s+any\b/g)]).toHaveLength(1)
    expect(blanked.split('\n')[0]).toContain('as const')
    expect(blanked.split('\n')[1]).toContain('as any')
  })
})

describe('getGraphqlOperationMethods', () => {
  // The regression this replaced: the old line scanner took the first `{` after the declaration
  // line, so a method with an @Args object literal had THAT literal captured as its body. Callers
  // then tested the wrong text — the resolver-scope check skipped almost every operation.
  it('captures the real body when a parameter contains an object literal', () => {
    const [operation] = getGraphqlOperationMethods(`
      @Resolver()
      class StorageResolver {
        @Mutation(() => Boolean)
        async deleteFile(
          @Args('uploadId', { type: () => String }) uploadId: string,
          @CtxUser() user: User,
        ): Promise<boolean> {
          await this.storageService.deleteFile(uploadId, user.id)
          return true
        }
      }
    `)

    expect(operation.name).toBe('deleteFile')
    expect(operation.body).toContain('this.storageService.deleteFile(uploadId, user.id)')
    expect(operation.body).not.toContain('type: () => String')
  })

  // @CtxUser() is a parameter decorator: it appears in neither `decorators` nor `body`.
  it('exposes the whole method, parameters included, as text', () => {
    const [operation] = getGraphqlOperationMethods(`
      @Resolver()
      class FileResolver {
        @Query(() => [String])
        async userFiles(@CtxUser() user: User): Promise<string[]> {
          return this.service.getUserFiles(user.id)
        }
      }
    `)

    expect(operation.decorators).not.toContain('@CtxUser')
    expect(operation.body).not.toContain('@CtxUser')
    expect(operation.text).toContain('@CtxUser()')
  })

  it('returns only GraphQL operations', () => {
    const operations = getGraphqlOperationMethods(`
      @Resolver()
      class MixedResolver {
        @Query(() => String)
        anOperation(): string {
          return 'x'
        }

        private aHelper(): string {
          return 'y'
        }
      }
    `)

    expect(operations.map(operation => operation.name)).toEqual(['anOperation'])
  })

  it('reports the line of the method name', () => {
    const [operation] = getGraphqlOperationMethods(
      [
        '@Resolver()',
        'class R {',
        '  @Query(() => String)',
        '  thing(): string {',
        '    return {}',
        '  }',
        '}',
      ].join('\n'),
    )

    expect(operation.line).toBe(4)
  })

  it('handles a resolver with no operations', () => {
    expect(getGraphqlOperationMethods('class Plain { helper() { return 1 } }')).toEqual([])
  })
})

describe('getExternalImportSpecifiers', () => {
  it('returns external specifiers and ignores relative siblings', () => {
    expect(
      getExternalImportSpecifiers(`
        import ts from 'typescript'
        import { parse } from 'graphql'
        import { helper } from './doctor-auth-analysis'
        import { other } from '../tools/thing'
      `),
    ).toEqual(['graphql', 'typescript'])
  })

  it('catches a workspace-scoped import — the one that resolves in a single repo', () => {
    expect(
      getExternalImportSpecifiers("import { ConfigService } from '@nestled-template/api/config'"),
    ).toEqual(['@nestled-template/api/config'])
  })

  // An import specifier IS a string literal, so a scan that blanks strings to dodge comment
  // false-positives blanks the thing being inspected. Reading the AST avoids both traps.
  it('ignores a specifier-shaped string in a comment or a plain string', () => {
    expect(
      getExternalImportSpecifiers(`
        // import { x } from '@mi-core/api/utils'
        const note = '@cashcast/api/config'
        import ts from 'typescript'
      `),
    ).toEqual(['typescript'])
  })

  it('catches dynamic import and require, not just static imports', () => {
    expect(
      getExternalImportSpecifiers(`
        const a = await import('@mi-core/api/utils')
        const b = require('@muzebook/api/config')
      `),
    ).toEqual(['@mi-core/api/utils', '@muzebook/api/config'])
  })

  // `import x = require('…')` reaches a module without an ImportDeclaration or a CallExpression, so
  // a scan built from those two alone lets it through — a silent bypass of the portability rule.
  it('catches import-equals-require, which is neither an import declaration nor a call', () => {
    expect(getExternalImportSpecifiers("import cfg = require('@mi-core/api/config')")).toEqual([
      '@mi-core/api/config',
    ])
  })

  it('ignores a relative import-equals and a namespace alias', () => {
    expect(
      getExternalImportSpecifiers("import helper = require('./doctor-auth-analysis')"),
    ).toEqual([])
    // Not a module reference at all — aliasing an existing namespace imports nothing.
    expect(getExternalImportSpecifiers('import factory = ts.factory')).toEqual([])
  })

  it('catches a re-export, which imports just as effectively', () => {
    expect(getExternalImportSpecifiers("export * from '@mi-core/api/utils'")).toEqual([
      '@mi-core/api/utils',
    ])
  })

  it('deduplicates', () => {
    expect(
      getExternalImportSpecifiers(`
        import ts from 'typescript'
        import type { Node } from 'typescript'
      `),
    ).toEqual(['typescript'])
  })
})
