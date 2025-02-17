import { formatFiles, installPackagesTask, joinPathFragments, readJson, Tree } from '@nx/devkit'
import { libraryGenerator } from '@nx/nest/src/generators/library/library'
import { generateTemplateFiles, getNpmScope, installPlugins } from '../shared/utils'
import { promptProvider } from './prompts'
import { ApiLibGeneratorSchema } from './schema'

async function apiGenerator(tree: Tree, schema: ApiLibGeneratorSchema, type: string) {
  const npmScope = getNpmScope(tree)
  const libraryRoot = joinPathFragments('libs', 'api', schema.name, type)
  const libraryName = `api-${schema.name}-${type}`
  const importPath = `@${npmScope}/api/${schema.name}/${type}`

  await libraryGenerator(tree, {
    name: libraryName,
    directory: libraryRoot,
    tags: `scope:api,type:${type}`,
    importPath,
  })

  generateTemplateFiles({
    tree,
    schema,
    libraryRoot,
    type,
    templatePath: __dirname,
    npmScope,
  })

  if (schema.name === 'core' && type === 'data-access') {
    // Add specific dependencies for this generator
    const dependencies = {
      'graphql-type-json': 'latest',
      '@nestjs/graphql': 'latest',
      '@nestjs/common': 'latest',
      '@prisma/client': 'latest',
    }

    const devDependencies = {}

    // Update package.json
    const packageJson = readJson(tree, 'package.json')

    // Add prisma schema path
    packageJson.prisma = {
      schema: 'libs/api/core/data-access/src/prisma/schema.prisma',
      seed: 'ts-node libs/api/core/data-access/src/prisma/seed.ts',
    }

    // Add scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      affected: 'nx affected',
      'affected:apps': 'nx affected:apps',
      'affected:build': 'nx affected:build',
      'affected:dep-graph': 'nx affected:dep-graph',
      'affected:e2e': 'nx affected:e2e',
      'affected:libs': 'nx affected:libs',
      'affected:lint': 'nx affected:lint',
      'affected:test': 'nx affected:test',
      'dep-graph': 'nx dep-graph',
      'build:api': 'nx build api --prod --skip-nx-cache',
      'deploy-api': 'git checkout api-deploy && git merge develop && git push && git checkout develop',
      'dev:api': 'nx serve api',
      format: 'nx format:write',
      'format:check': 'nx format:check',
      'format:write': 'nx format:write',
      help: 'nx help',
      lint: 'nx workspace-lint && nx lint',
      nx: 'nx',
      'precommit-lint': 'nx format:write --uncommitted & nx affected --target eslint --uncommitted',
      'prisma:apply': 'pnpm prisma:format && pnpm prisma db push',
      'prisma:format': 'pnpm prisma format',
      'prisma:generate': 'pnpm prisma generate',
      'prisma:migrate': 'pnpm prisma migrate save && pnpm prisma migrate up',
      'prisma:migrate:dev': 'pnpm prisma migrate dev',
      'prisma:migrate:prod': 'pnpm prisma migrate deploy',
      'prisma:reset': 'pnpm prisma migrate reset && pnpm prisma:seed',
      'prisma:seed': 'npx prisma db seed',
      'prisma:studio': 'pnpm prisma studio',
      sdk: 'graphql-codegen --config libs/shared/util-sdk/src/codegen.yml',
      'sdk:watch': 'pnpm sdk --watch',
      'types:watch': 'nodemon',
      setup: 'pnpm prisma:apply',
      test: 'nx test',
      'test:api': 'pnpm nx e2e api-e2e',
      'test:ci': 'pnpm test:api',
      update: 'nx migrate latest',
      'workspace-generator': 'nx workspace-generator',
    }

    tree.write('package.json', JSON.stringify(packageJson, null, 2))

    // Use the shared installPlugins utility to install the necessary packages
    await installPlugins(tree, dependencies, devDependencies)
  }

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

export default async function generateLibraries(tree: Tree, schema: ApiLibGeneratorSchema) {
  const options = await promptProvider.handleMissingOptions(schema)
  const tasks: (() => void)[] = []

  if (options.generateAccounts || options.useDefaults) {
    tasks.push(await apiGenerator(tree, { ...schema, name: 'account' }, 'data-access'))
    tasks.push(await apiGenerator(tree, { ...schema, name: 'account' }, 'feature'))
  }

  if (options.generateAuth || options.useDefaults) {
    tasks.push(await apiGenerator(tree, { ...schema, name: 'auth' }, 'data-access'))
    tasks.push(await apiGenerator(tree, { ...schema, name: 'auth' }, 'feature'))
    tasks.push(await apiGenerator(tree, { ...schema, name: 'auth' }, 'util'))
  }

  if (options.generateCore || options.useDefaults) {
    tasks.push(await apiGenerator(tree, { ...schema, name: 'core' }, 'data-access'))
    tasks.push(await apiGenerator(tree, { ...schema, name: 'core' }, 'feature'))
  }

  if (options.generateMailer || options.useDefaults) {
    tasks.push(await apiGenerator(tree, { ...schema, name: 'mailer' }, 'data-access'))
  }

  if (options.generateUser || options.useDefaults) {
    tasks.push(await apiGenerator(tree, { ...schema, name: 'user' }, 'data-access'))
    tasks.push(await apiGenerator(tree, { ...schema, name: 'user' }, 'feature'))
  }

  return () => {
    tasks.forEach((task) => task?.())
  }
}
