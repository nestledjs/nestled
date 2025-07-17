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
import { addScriptToPackageJson, getPluralName, getAllPrismaModels, generateDatabaseModelContent, deleteFiles, deleteDirectory } from '@nestledjs/utils'
import { libraryGenerator } from '@nx/js'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { getDMMF } from '@prisma/internals'

const SCALAR_TYPES = ['String', 'Int', 'Boolean', 'Float', 'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes']

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

// Helper to get the default field for a model from DMMF
function getDefaultField(model: any): string | undefined {
  return model.fields.find(
    (f: any) => f?.documentation?.includes('@defaultField')
  )?.name
}

// Helper to get admin fragment fields for a model
function getAdminFragmentFields(model: any, allModels: ReadonlyArray<any>): string {
  return model.fields
    .filter((f: any) => !f.isList && !f.relationName && !f.isId)
    .map((f: any) => f.name)
    .concat(
      model.fields
        .filter((f: any) => f.relationName && !f.isList)
        .map((f: any) => {
          const relatedModel = allModels.find((m: any) => m.name === f.type)
          const defaultField = relatedModel ? getDefaultField(relatedModel) : null
          // Refactored to avoid nested template literals
          let relationFields = 'id';
          if (defaultField) {
            relationFields += `\n    ${defaultField}`;
          }
          return `${f.name} {\n    ${relationFields}\n  }`;
        })
    )
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

    // Clean up default generated files that we don't need
    deleteFiles(tree, [
      'libs/shared/sdk/src/lib/sdk.ts',
      'libs/shared/sdk/src/lib/sdk.spec.ts'
    ])
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

  // 2. Parse models using Prisma DMMF for doc comments
  const dmmf = await getDMMF({ datamodel: schemaContent })
  const allModels = dmmf.datamodel.models

  // 3. Ensure sdk library exists
  await ensureSdkLibrary(tree, dependencies)

  // 4. Generate database models file
  const allModelsForDb = await getAllPrismaModels(tree)
  const databaseModelContent = generateDatabaseModelContent(allModelsForDb)
  tree.write('libs/shared/sdk/src/lib/database-models.ts', databaseModelContent)

  // 5. For each model, generate client files (existing logic)
  for (const model of allModels) {
    const modelName = model.name
    const kebabName = kebabCase(modelName)
    const modelDir = `libs/shared/sdk/src/graphql/${kebabName}`
    if (tree.exists(modelDir)) continue

    const className = modelName
    const propertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1)
    const pluralClassName = dependencies.getPluralName(className)
    const pluralPropertyName = dependencies.getPluralName(propertyName)
    const fragmentFields = model.fields
      .filter(
        (f: any) =>
          !f.isList &&
          !f.relationName &&
          f.name !== 'id' &&
          !f.name.endsWith('Id') &&
          SCALAR_TYPES.includes(f.type)
      )
      .map((f: any) => f.name)
      .join('\n  ')

    dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './graphql'), modelDir, {
      className,
      propertyName,
      pluralClassName,
      pluralPropertyName,
      fragmentFields,
      kebabName,
      adminPrefix: '',
      tmpl: '',
    })
    ;['fragments', 'mutations', 'queries'].forEach((type) => {
      const oldPath = dependencies.join(modelDir, `__name__-${type}.graphql`)
      const newPath = dependencies.join(modelDir, `${kebabName}-${type}.graphql`)
      if (tree.exists(oldPath)) {
        tree.rename(oldPath, newPath)
      }
    })
  }

  // 6. For each model, generate admin files (always overwrite)
  // Clean up the admin-graphql directory before generating new files
  deleteDirectory(tree, 'libs/shared/sdk/src/admin-graphql');
  console.log('Generating admin files for models:', allModels.map((m: any) => m.name));
  for (const model of allModels) {
    const modelName = model.name
    const kebabName = kebabCase(modelName)
    const modelDir = `libs/shared/sdk/src/admin-graphql/${kebabName}`
    // Always overwrite admin files
    const className = modelName
    const propertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1)
    const pluralClassName = dependencies.getPluralName(className)
    const pluralPropertyName = dependencies.getPluralName(propertyName)
    const fragmentFields = getAdminFragmentFields(model, allModels)
    const adminPrefix = 'Admin'

    console.log('Generating admin files for', modelName, 'at', modelDir);

    dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './graphql'), modelDir, {
      className,
      propertyName,
      pluralClassName,
      pluralPropertyName,
      fragmentFields,
      kebabName,
      adminPrefix,
      tmpl: '',
    })
    ;['fragments', 'mutations', 'queries'].forEach((type) => {
      const oldPath = dependencies.join(modelDir, `__name__-${type}.graphql`)
      const newPath = dependencies.join(modelDir, `${kebabName}-${type}.graphql`)
      if (tree.exists(oldPath)) {
        tree.rename(oldPath, newPath)
      }
    })
  }

  // 7. Always write codegen.yml and index.ts
  const sdkSrcDir = 'libs/shared/sdk/src'
  dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './files'), sdkSrcDir, { tmpl: '' })

  // 8. Add scripts to package.json
  dependencies.addScriptToPackageJson(tree, 'sdk', 'graphql-codegen --config libs/shared/sdk/src/codegen.yml')
  dependencies.addScriptToPackageJson(tree, 'sdk:watch', 'pnpm sdk --watch')

  // 9. Add GraphQL Codegen packages as devDependencies
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
