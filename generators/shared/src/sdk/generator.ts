import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  readJson,
  Tree,
} from '@nx/devkit'
import * as path from 'path'
import * as fs from 'fs'
import { addScriptToPackageJson, getPluralName } from '@nestledjs/utils'
import { libraryGenerator } from '@nx/js'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

const SCALAR_TYPES = ['String', 'Int', 'Boolean', 'Float', 'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes']

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function parsePrismaModels(schemaContent: string) {
  const modelRegex = /model (\w+) \{([\s\S]*?)\}/g
  const fieldRegex = /^\s*(\w+)\s+(\w+(?:\[\])?)(\??)(?:\s+(.*))?$/
  const models: Record<string, { fields: { name: string; type: string; isList: boolean; isRelation: boolean }[] }> = {}

  let match
  while ((match = modelRegex.exec(schemaContent))) {
    const [, modelName, body] = match
    const fields = []

    // Split the model body into lines and process each line
    const lines = body.split('\n')
    for (const line of lines) {
      const fieldMatch = fieldRegex.exec(line)
      if (fieldMatch) {
        const [, name, type, , attrs] = fieldMatch
        const isList = type.endsWith('[]')
        const isRelation = attrs && attrs.includes('@relation')
        fields.push({
          name,
          type: type.replace('[]', ''),
          isList,
          isRelation,
        })
      }
    }

    models[modelName] = { fields }
  }
  return models
}

function getFragmentFields(fields: { name: string; type: string; isList: boolean; isRelation: boolean }[]) {
  return fields
    .filter(
      (f) =>
        !f.isList &&
        !f.isRelation &&
        f.name !== 'id' &&
        !f.name.endsWith('Id') &&
        SCALAR_TYPES.includes(f.type) // allow all non-relation, non-list, non-id fields (including enums)
    )
    .map((f) => f.name)
    .join('\n  ')
}

async function ensureSdkLibrary(tree: Tree, dependencies: SdkGeneratorDependencies) {
  const sdkPath = 'libs/shared/sdk'
  const npmScope = getNpmScope(tree)
  if (!tree.exists(sdkPath)) {
    // Create the sdk library if it doesn't exist
    await dependencies.libraryGenerator(tree, {
      name: 'sdk',
      directory: 'libs/shared/sdk',
      importPath: `@${npmScope}/shared/sdk`,
      publishable: false,
      buildable: false,
      unitTestRunner: 'vitest',
      linter: 'eslint',
      tags: 'type:shared,scope:shared',
    })
  }
}

function readPrismaSchema(absSchemaPath: string, dependencies: SdkGeneratorDependencies): string {
  if (dependencies.statSync(absSchemaPath).isDirectory()) {
    // Read all .prisma files in the directory and concatenate
    const files = dependencies
      .readdirSync(absSchemaPath)
      .filter((f) => f.endsWith('.prisma'))
      .map((f) => dependencies.join(absSchemaPath, f))
    return files.map((f) => dependencies.readFileSync(f, 'utf-8')).join('\n')
  } else {
    // Read the file directly
    return dependencies.readFileSync(absSchemaPath, 'utf-8')
  }
}

// Group dependencies
const defaultDependencies = {
  formatFiles,
  installPackagesTask,
  generateFiles,
  joinPathFragments,
  readJson,
  addDependenciesToPackageJson,
  addScriptToPackageJson,
  getPluralName,
  libraryGenerator,
  // Specific functions from path and fs
  join: path.join,
  existsSync: fs.existsSync,
  statSync: fs.statSync,
  readdirSync: fs.readdirSync,
  readFileSync: fs.readFileSync,
}
export type SdkGeneratorDependencies = typeof defaultDependencies

export async function sdkGeneratorLogic(
  tree: Tree,
  schema: unknown,
  dependencies: SdkGeneratorDependencies = defaultDependencies,
) {
  // 1. Read prisma schema path from package.json
  const pkgJson = dependencies.readJson(tree, 'package.json')
  const prismaSchemaPath = pkgJson.prisma?.schema
  if (!prismaSchemaPath) throw new Error('Prisma schema path not found in package.json')
  const absSchemaPath = dependencies.join(tree.root, prismaSchemaPath)
  if (!dependencies.existsSync(absSchemaPath)) throw new Error(`Prisma schema not found at ${absSchemaPath}`)
  const schemaContent = readPrismaSchema(absSchemaPath, dependencies)

  // 2. Parse models
  const models = parsePrismaModels(schemaContent)

  // 3. Ensure sdk library exists
  await ensureSdkLibrary(tree, dependencies)

  // 4. For each model, generate files
  for (const [modelName, { fields }] of Object.entries(models)) {
    const kebabName = kebabCase(modelName)
    const modelDir = `libs/shared/sdk/src/graphql/${kebabName}`
    if (tree.exists(modelDir)) continue

    const className = modelName
    const propertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1)
    const pluralClassName = dependencies.getPluralName(className)
    const pluralPropertyName = dependencies.getPluralName(propertyName)
    const fragmentFields = getFragmentFields(fields)

    dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './graphql'), modelDir, {
      className,
      propertyName,
      pluralClassName,
      pluralPropertyName,
      fragmentFields,
      kebabName,
      tmpl: '',
    })
    // Rename generated files to kebab-case
    ;['fragments', 'mutations', 'queries'].forEach((type) => {
      const oldPath = dependencies.join(modelDir, `__name__-${type}.graphql`)
      const newPath = dependencies.join(modelDir, `${kebabName}-${type}.graphql`)
      if (tree.exists(oldPath)) {
        tree.rename(oldPath, newPath)
      }
    })
  }

  // 5. Always write codegen.yml and index.ts
  const sdkSrcDir = 'libs/shared/sdk/src'
  dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './files'), sdkSrcDir, { tmpl: '' })

  // 6. Add scripts to package.json
  dependencies.addScriptToPackageJson(tree, 'sdk', 'graphql-codegen --config libs/shared/sdk/src/codegen.yml')
  dependencies.addScriptToPackageJson(tree, 'sdk:watch', 'pnpm sdk --watch')

  // 7. Add GraphQL Codegen packages as devDependencies
  dependencies.addDependenciesToPackageJson(
    tree,
    {},
    {
      '@graphql-codegen/cli': '^5.0.7',
      '@graphql-codegen/typescript': '^4.1.6',
      '@graphql-codegen/introspection': '^4.0.3',
      '@graphql-codegen/typescript-document-nodes': '^4.0.16',
      '@graphql-codegen/typescript-operations': '^4.6.1',
      '@graphql-codegen/typescript-react-apollo': '^4.3.3',
    },
  )

  await dependencies.formatFiles(tree)
  return () => {
    dependencies.installPackagesTask(tree)
  }
}

export default async function (tree: Tree, schema: unknown) {
  return sdkGeneratorLogic(tree, schema)
}
