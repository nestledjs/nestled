import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { filterSkippedRelationFields, getSkippedModelNames } from '../lib/engine'
import { generateModels, generateEnums, generateIndex, generateModelsLogic, resolvePrismaImportPath } from './generator'

// Fixture exercises: scalars, Float/DateTime conditional imports, Decimal/BigInt/Json/Bytes,
// single + list enums, single + list relations, and a @skipCrud model with an inbound relation.
const FIXTURE_SCHEMA = `
generator client {
  provider = "prisma-client"
}

datasource db {
  provider = "postgresql"
}

enum Status {
  ACTIVE
  INACTIVE
}

enum Tag {
  A
  B
}

model Post {
  id        String   @id
  title     String
  views     Int
  rating    Float
  published Boolean
  createdAt DateTime
  price     Decimal
  big       BigInt
  meta      Json
  data      Bytes
  /// @graphqlOmit
  encryptedToken String
  status    Status
  tags      Tag[]
  author    Author?  @relation(fields: [authorId], references: [id])
  authorId  String?
  secret    Secret?  @relation(fields: [secretId], references: [id])
  secretId  String?  @unique
}

model Author {
  id    String @id
  name  String
  posts Post[]
}

/// @skipCrud
model Secret {
  id    String @id
  token String
  post  Post?
}
`

const SCHEMA_DIR = 'libs/api/prisma/src/lib/schemas'
const OUTPUT = 'libs/api/core/models/src/lib/models'

function setupTree(): Tree {
  const tree = createTreeWithEmptyWorkspace()
  tree.write(`${SCHEMA_DIR}/schema.prisma`, FIXTURE_SCHEMA)
  tree.write(
    'tsconfig.base.json',
    JSON.stringify({
      compilerOptions: {
        paths: {
          '@test/api/core/data-access': ['libs/api/core/data-access/src/index.ts'],
          '@test/api/prisma': ['libs/api/prisma/src/index.ts'],
        },
      },
    }),
  )
  return tree
}

// The precise-content assertions run against the PURE generator functions, which are
// formatter-independent (they emit the canonical hand-authored string form). The full
// generateModelsLogic path additionally runs Prettier, whose output depends on the ambient
// config — so those tests assert wiring/identifiers rather than exact punctuation.
describe('models generator — content', () => {
  let models: string
  let enums: string

  beforeAll(async () => {
    const dmmf = await getDMMF({ datamodel: FIXTURE_SCHEMA })
    const allModels = dmmf.datamodel.models
    const skipped = getSkippedModelNames(allModels)
    const visibleModels = allModels
      .filter((m) => !skipped.has(m.name))
      .map((m) => ({ ...m, fields: filterSkippedRelationFields(m.fields, skipped) }))
    models = generateModels(visibleModels, dmmf.datamodel.enums, '@test/api/prisma')
    enums = generateEnums(dmmf.datamodel.enums, '@test/api/prisma')
  })

  it('conditionally imports scalar helpers based on usage (Feb-2026 fixes)', () => {
    expect(models).toContain(`import { Field, ObjectType, Int, Float, GraphQLISODateTime } from '@nestjs/graphql';`)
    expect(models).toContain(`import { GraphQLJSON } from 'graphql-type-json';`)
    expect(models).toContain(`import Decimal from 'decimal.js';`)
    expect(models).toContain(`import { GraphQLDecimal } from 'prisma-graphql-type-decimal';`)
    expect(models).toContain(`import { GraphQLBigInt } from 'graphql-scalars';`)
    expect(models).toContain(`import type { JsonValue } from '@test/api/prisma';`)
    expect(models).toContain(`import { Status, Tag } from './enums';`)
  })

  it('maps special scalar types to the correct GraphQL + TS types', () => {
    expect(models).toContain(`@Field(() => GraphQLDecimal)`)
    expect(models).toContain(`price!: Decimal;`)
    expect(models).toContain(`@Field(() => GraphQLBigInt)`)
    expect(models).toContain(`big!: bigint;`)
    expect(models).toContain(`@Field(() => GraphQLJSON)`)
    expect(models).toContain(`meta!: JsonValue;`)
    expect(models).toContain(`data!: Buffer;`)
    expect(models).toContain(`@Field(() => GraphQLISODateTime)`)
    expect(models).toContain(`createdAt!: Date;`)
  })

  it('handles single + list enums', () => {
    expect(models).toContain(`@Field(() => Status)`)
    expect(models).toContain(`status!: Status;`)
    expect(models).toContain(`@Field(() => [Tag])`)
    expect(models).toContain(`tags!: Tag[];`)
  })

  it('handles single + list relations as nullable Partial types', () => {
    expect(models).toContain(`@Field(() => Author, { nullable: true })`)
    expect(models).toContain(`author?: Partial<Author> | null;`)
    expect(models).toContain(`@Field(() => [Post], { nullable: true })`)
    expect(models).toContain(`posts?: Partial<Post>[] | null;`)
  })

  it('omits @graphqlOmit fields from the ObjectType (security — keeps them out of the server schema)', () => {
    // In code-first NestJS the emitted @Field() IS the GraphQL schema, so an omitted
    // field must produce neither a @Field decorator nor a class property.
    expect(models).toContain('export class Post')
    expect(models).not.toContain('encryptedToken')
  })

  it('excludes @skipCrud models and strips inbound relation fields', () => {
    expect(models).toContain(`export class Post`)
    expect(models).toContain(`export class Author`)
    expect(models).not.toContain(`class Secret`)
    // The Post.secret relation points at a skipped model and must be stripped...
    expect(models).not.toContain(`secret?:`)
    // ...but the plain scalar FK column (secretId) is NOT a relation and stays.
    expect(models).toContain(`secretId?: string | null;`)
  })

  it('generates enums.ts with import-before-export ordering (Feb-2026 fix)', () => {
    expect(enums).toContain(`import { Status, Tag } from '@test/api/prisma';`)
    expect(enums).toContain(`export { Status, Tag };`)
    expect(enums).toContain(`registerEnumType(Status, { name: 'Status' });`)
    expect(enums).toContain(`registerEnumType(Tag, { name: 'Tag' });`)
    const importIdx = enums.indexOf(`import { Status, Tag } from`)
    const exportIdx = enums.indexOf(`export { Status, Tag };`)
    expect(importIdx).toBeGreaterThanOrEqual(0)
    expect(exportIdx).toBeGreaterThan(importIdx)
  })

  it('generates a stable index.ts', () => {
    expect(generateIndex()).toBe(`// Generated from Prisma schema
export * from './models'
export * from './enums'
`)
  })

  it('exposes generateModels as a pure function', () => {
    const out = generateModels(
      [{ name: 'Thing', fields: [{ name: 'id', type: 'String', kind: 'scalar', isRequired: true, isList: false }] }],
      [],
      '@test/api/prisma',
    )
    expect(out).toContain('export class Thing')
    expect(out).toContain('id!: string;')
  })
})

describe('models generator — logic + wiring', () => {
  let tree: Tree

  beforeEach(async () => {
    tree = setupTree()
    await generateModelsLogic(tree, {})
  })

  it('writes all three output files', () => {
    expect(tree.exists(`${OUTPUT}/models.ts`)).toBe(true)
    expect(tree.exists(`${OUTPUT}/enums.ts`)).toBe(true)
    expect(tree.exists(`${OUTPUT}/index.ts`)).toBe(true)
  })

  it('emits visible models, excludes @skipCrud, and injects the resolved prisma import path', () => {
    const models = tree.read(`${OUTPUT}/models.ts`, 'utf-8') as string
    const enums = tree.read(`${OUTPUT}/enums.ts`, 'utf-8') as string
    expect(models).toContain('export class Post')
    expect(models).toContain('export class Author')
    expect(models).not.toContain('class Secret')
    expect(enums).toContain('@test/api/prisma')
    // The JsonValue import in models.ts must use the resolved wrapper path, not the
    // hardcoded @prisma/client/runtime/client (which defeats the wrapper's purpose).
    expect(models).toContain(`from '@test/api/prisma'`)
    expect(models).not.toContain('@prisma/client/runtime/client')
    // @graphqlOmit fields must be absent from the emitted server schema.
    expect(models).not.toContain('encryptedToken')
  })

  it('honors a custom outputPath', async () => {
    const t = setupTree()
    await generateModelsLogic(t, { outputPath: 'libs/custom/models' })
    expect(t.exists('libs/custom/models/models.ts')).toBe(true)
  })
})

describe('resolvePrismaImportPath', () => {
  it('resolves the prisma import path from tsconfig.base.json path aliases', () => {
    expect(resolvePrismaImportPath(setupTree())).toBe('@test/api/prisma')
  })

  it('prefers an explicit prismaImportPath override', () => {
    expect(resolvePrismaImportPath(setupTree(), '@custom/prisma')).toBe('@custom/prisma')
  })

  it('fails loudly when the prisma import path cannot be resolved', () => {
    const bare = createTreeWithEmptyWorkspace()
    bare.write('tsconfig.base.json', JSON.stringify({ compilerOptions: { paths: {} } }))
    expect(() => resolvePrismaImportPath(bare)).toThrow(/could not resolve the Prisma wrapper import path/)
  })
})
