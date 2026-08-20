import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { loadModels, verifySelects,
  readRepoConfig,
  findSelectFiles,
} from './verify-selects.mjs'

const toolPath = fileURLToPath(new URL('./verify-selects.mjs', import.meta.url))
const workspaces = []

const writeFixture = (workspace, path, source) => {
  const file = join(workspace, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, source)
}

const createWorkspace = () => {
  const workspace = mkdtempSync(join(tmpdir(), 'verify-selects-'))
  workspaces.push(workspace)
  writeFixture(
    workspace,
    'libs/api/prisma/src/lib/schemas/schema.prisma',
    `
      datasource db {
        provider = "postgresql"
      }

      generator client {
        provider = "prisma-client"
        output = "../generated"
      }

      model User {
        id    String @id
        posts Post[]
      }

      model Post {
        id       String @id
        authorId String?
        author   User? @relation(fields: [authorId], references: [id])
      }
    `,
  )
  return workspace
}

afterEach(() => {
  for (const workspace of workspaces.splice(0)) rmSync(workspace, { recursive: true, force: true })
})

describe('verify-selects', () => {
  it('loads authoritative DMMF and reports invalid fields and empty nested selects', async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'custom-selects/user.select.ts',
      `
        export const USER_SELECT = {
          id: true,
          posts: { select: { id: true } },
        }

        export const USER_BAD_SELECT = {
          likesCount: true,
          posts: { select: {} },
        }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    expect(result.source).toBe('@prisma/internals')
    expect(result.problems).toEqual([
      {
        file: 'custom-selects/user.select.ts',
        kind: 'not-a-column',
        model: 'User',
        path: 'USER_BAD_SELECT.likesCount',
      },
      {
        file: 'custom-selects/user.select.ts',
        kind: 'empty-select',
        model: 'User',
        path: 'USER_BAD_SELECT.posts',
      },
    ])
    expect(result.unresolved).toEqual([])
  })

  it('walks relations and scopes model overrides to the constant they precede', async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'custom-selects/settings.select.ts',
      `
        const AUTHOR_SELECT = {
          id: true,
          anotherMissingUserField: true,
        }

        const MEMBER_USER_SELECT = { id: true }

        /** @prisma-model Post */
        export const SETTINGS_SELECT = {
          id: true,
          author: { select: { missingUserField: true } },
        }

        export const MYSTERY_SELECT = { id: true }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    expect(result.problems).toEqual([
      {
        file: 'custom-selects/settings.select.ts',
        kind: 'not-a-column',
        model: 'User',
        path: 'AUTHOR_SELECT.anotherMissingUserField',
      },
      {
        file: 'custom-selects/settings.select.ts',
        kind: 'not-a-column',
        model: 'User',
        path: 'SETTINGS_SELECT.author.missingUserField',
      },
    ])
    expect(result.unresolved).toEqual([
      { file: 'custom-selects/settings.select.ts', const: 'MYSTERY_SELECT' },
    ])
  })

  it('uses the regex schema fallback when Prisma internals are unavailable', async () => {
    const workspace = createWorkspace()
    const result = await loadModels({
      cwd: workspace,
      internalsLoader: async () => {
        throw new Error('not installed')
      },
    })

    expect(result.source).toBe('regex fallback')
    expect(result.models.User).toEqual({ id: null, posts: 'Post' })
  })

  it('supports configurable roots, JSON output, and a non-zero finding exit', () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'chosen/user.select.ts',
      'export const USER_SELECT = { friendsCount: true }',
    )
    writeFixture(workspace, 'ignored/user.select.ts', 'export const USER_SELECT = { id: true }')

    const result = spawnSync(process.execPath, [toolPath, '--json', 'chosen'], {
      cwd: workspace,
      encoding: 'utf8',
    })

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.files).toBe(1)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0].path).toBe('USER_SELECT.friendsCount')
    expect(result.stderr).toBe('')
  })

  it('exits successfully when every discovered select is valid', () => {
    const workspace = createWorkspace()
    writeFixture(workspace, 'chosen/user.select.ts', 'export const USER_SELECT = { id: true }')

    expect(() =>
      execFileSync(process.execPath, [toolPath, 'chosen'], {
        cwd: workspace,
        encoding: 'utf8',
      }),
    ).not.toThrow()
  })

  it('does not validate Prisma filter grammar inside where/orderBy as columns', async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'custom-selects/user.select.ts',
      `
        export const USER_SELECT = {
          id: true,
          posts: {
            where: { id: { equals: 'x' }, author: { is: { id: 'y' } } },
            orderBy: { id: 'desc' },
            take: 5,
            select: { id: true },
          },
        }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    // `equals` and `is` are filter operators, not columns on Post. Walking them reported them
    // as not-a-column, which made the tool unusable on any select carrying a where clause.
    expect(result.problems).toEqual([])
  })

  it('still reports a genuine bad column that sits alongside a where clause', async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'custom-selects/user.select.ts',
      `
        export const USER_SELECT = {
          posts: {
            where: { id: { equals: 'x' } },
            select: { likesCount: true },
          },
        }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    // Skipping `where` must not blind the tool to the select beside it.
    expect(result.problems).toEqual([
      {
        file: 'custom-selects/user.select.ts',
        path: 'USER_SELECT.posts.likesCount',
        model: 'Post',
        kind: 'not-a-column',
      },
    ])
  })

  it('does not let a @prisma-model inside one constant resolve the next one', async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'custom-selects/misc.select.ts',
      `
        export const FIRST_SELECT = {
          id: true,
          // @prisma-model User  <- mentioned INSIDE this constant, not before the next one
        }

        export const TOTALLY_UNKNOWN_THING = {
          id: true,
        }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    // Both are unresolvable by name. Scanning from the previous constant's START swept up the
    // annotation in its body and silently validated TOTALLY_UNKNOWN_THING against User.
    expect(result.unresolved.map(entry => entry.const).sort()).toEqual([
      'FIRST_SELECT',
      'TOTALLY_UNKNOWN_THING',
    ])
  })

  it('still honours a @prisma-model annotation placed before its constant', async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'custom-selects/misc.select.ts',
      `
        export const FIRST_SELECT = { id: true }

        // @prisma-model Post
        export const TOTALLY_UNKNOWN_THING = {
          likesCount: true,
        }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    // Tightening the scan window must not break the annotation's actual purpose.
    expect(result.unresolved.map(entry => entry.const)).toEqual(['FIRST_SELECT'])
    expect(result.problems).toEqual([
      {
        file: 'custom-selects/misc.select.ts',
        path: 'TOTALLY_UNKNOWN_THING.likesCount',
        model: 'Post',
        kind: 'not-a-column',
      },
    ])
  })

  it('is not fooled by a closing brace inside a comment or string', async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      'custom-selects/misc.select.ts',
      `
        export const FIRST_SELECT = {
          id: true,
          // a closing brace in a comment: }  then @prisma-model User
        }

        export const TOTALLY_UNKNOWN_THING = {
          id: true,
        }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    // closingBrace() is not comment-aware, so counting braces on the raw source ended the first
    // constant at the `}` in that comment — putting the rest of its body, annotation included,
    // back into the next constant's window. Counting on the sanitized source fixes it; the mask
    // is length-preserving, so the offsets still line up with rawSource for the annotation scan.
    expect(result.unresolved.map(entry => entry.const).sort()).toEqual([
      'FIRST_SELECT',
      'TOTALLY_UNKNOWN_THING',
    ])
  })
})

// The skipped-local bug: `continue` used to skip advancing previousConstantEnd, so the skipped
// local's body stayed inside the NEXT constant's annotation window, and a @prisma-model mentioned
// in it resolved that constant to the wrong model. annotationBefore exists precisely to prevent
// this, and the skip quietly defeated it.
describe('annotation window with skipped constants', () => {
  it("does not let a skipped local's body annotate the next select", async () => {
    const workspace = createWorkspace()
    writeFixture(
      workspace,
      '.nestled-updates/doctor.config.json',
      JSON.stringify({ selectFileSuffixes: ['.select.ts', '.resolver.ts'] }),
    )
    writeFixture(
      workspace,
      'custom-selects/user.resolver.ts',
      `
        /** @prisma-model User */
        export const FIRST_SELECT = {
          id: true,
        }

        const where = {
          // @prisma-model Post
          id: true,
        }

        export const USER_SELECT = {
          posts: { select: { id: true } },
        }
      `,
    )

    const result = await verifySelects({ cwd: workspace, roots: ['custom-selects'] })

    // \`posts\` is valid on User and absent from Post. If the skipped \`where\` body stays in the
    // annotation window, USER_SELECT resolves to Post and this reports an invalid field.
    expect(result.problems).toEqual([])
    // And the ordinary local is not itself reported as an unresolvable select.
    expect(result.unresolved.map((entry) => entry.const)).not.toContain('where')
  })
})

describe('repo layout config', () => {
  const withRepo = (files) => {
    const repo = mkdtempSync(join(tmpdir(), 'verify-selects-config-'))
    for (const [relative, contents] of Object.entries(files)) {
      const full = join(repo, relative)
      mkdirSync(dirname(full), { recursive: true })
      writeFileSync(full, contents)
    }
    return repo
  }

  it('defaults to .select.ts when no config is present', () => {
    expect(readRepoConfig(withRepo({})).selectFileSuffixes).toEqual(['.select.ts'])
  })

  it('honours declared suffixes', () => {
    const repo = withRepo({
      '.nestled-updates/doctor.config.json': JSON.stringify({
        selectFileSuffixes: ['.select.ts', '.resolver.ts'],
      }),
    })

    expect(readRepoConfig(repo).selectFileSuffixes).toEqual(['.select.ts', '.resolver.ts'])
  })

  // Silently reverting to the default would make this checker pass by verifying an empty set.
  it('throws on malformed config rather than quietly scanning nothing', () => {
    expect(() => readRepoConfig(withRepo({ '.nestled-updates/doctor.config.json': '{ not json' }))).toThrow(
      'not valid JSON',
    )
    expect(() =>
      readRepoConfig(
        withRepo({ '.nestled-updates/doctor.config.json': JSON.stringify({ selectFileSuffixes: 'x' }) }),
      ),
    ).toThrow('array of non-empty strings')
  })

  // A dedicated select file holds nothing but selects, so camelCase names are real selects there —
  // mi-core has courseOverviewSelect. Requiring SCREAMING_SNAKE everywhere would stop verifying them.
  // A config file that exists is intent to configure. Defaulting on a typoed key would scan zero
  // files and pass, in exactly the repos that wrote the file BECAUSE the default finds nothing.
  it('rejects a config that omits selectFileSuffixes or declares it empty', () => {
    expect(() =>
      readRepoConfig(
        withRepo({ '.nestled-updates/doctor.config.json': JSON.stringify({ selectFileSufixes: ['.a.ts'] }) }),
      ),
    ).toThrow('non-empty array')

    expect(() =>
      readRepoConfig(
        withRepo({ '.nestled-updates/doctor.config.json': JSON.stringify({ selectFileSuffixes: [] }) }),
      ),
    ).toThrow('non-empty array')
  })

  it('requires conventional names only for suffixes beyond .select.ts', () => {
    const repo = withRepo({
      'libs/api/custom/src/a.select.ts': 'export const courseOverviewSelect = { id: true }\n',
      'libs/api/custom/src/b.resolver.ts': 'const where = { id: true }\nexport const GROUP_SELECT = { id: true }\n',
      '.nestled-updates/doctor.config.json': JSON.stringify({
        selectFileSuffixes: ['.select.ts', '.resolver.ts'],
      }),
    })

    const found = findSelectFiles({ cwd: repo, roots: ['libs/api/custom/src'] })
    const byName = Object.fromEntries(found.map((entry) => [entry.file.split('/').pop(), entry]))

    expect(byName['a.select.ts'].conventionalNamesOnly).toBe(false)
    expect(byName['b.resolver.ts'].conventionalNamesOnly).toBe(true)
  })
})
