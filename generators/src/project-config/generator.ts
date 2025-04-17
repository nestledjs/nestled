import { formatFiles, generateFiles, logger, Tree } from '@nx/devkit'
import * as path from 'path'

interface ConfigGeneratorSchema {
  overwritePrettier: boolean
  generateEnv: boolean
  generateDocker: boolean
  ignoreEnv: boolean
  // Add other options as needed
}

export default async function (tree: Tree, schema: ConfigGeneratorSchema) {
  const templateOptions = {
    ...schema,
    tmpl: '',
  }

  // Handle Prettier configuration
  if (schema.overwritePrettier) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', {
      ...templateOptions,
      dot: '.',
    })
    logger.info('✅ Generated .prettierrc file')
  } else {
    logger.info('⏭️  Skipping .prettierrc generation')
  }

  // Handle .env.example generation
  if (schema.generateEnv) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', {
      ...templateOptions,
      dot: '.',
    })
    logger.info('✅ Generated .env.example file')
  } else {
    logger.info('⏭️  Skipping .env.example generation')
  }

  // Handle Docker files generation
  if (schema.generateDocker) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', templateOptions)
    logger.info('✅ Generated Dockerfile and docker-compose.yml')

    // Add Docker scripts to package.json
    const packageJsonPath = 'package.json'
    if (tree.exists(packageJsonPath)) {
      const packageJsonContent = JSON.parse(tree.read(packageJsonPath, 'utf-8') || '{}')

      packageJsonContent.scripts = {
        ...packageJsonContent.scripts,
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
        'dev:api': 'nx serve api --skip-nx-cache',
        'docker:build': 'docker build . -t muzebook/api',
        'docker:down': 'docker compose down',
        'docker:push': 'docker push muzebook/api',
        'docker:run': 'docker run -it -p 8000:3000 muzebook/api',
        'docker:up': 'docker compose up',
        format: 'nx format:write',
        'format:check': 'nx format:check',
        'format:write': 'nx format:write',
        help: 'nx help',
        lint: 'nx workspace-lint && nx lint',
        nx: 'nx',
        'pre-commit:lint': 'nx format:write --uncommitted & nx affected --target eslint --uncommitted',
        'prisma:apply': 'pnpm prisma:format && pnpm prisma db push',
        'prisma:format': 'pnpm prisma format',
        'prisma:generate': 'pnpm prisma generate',
        'prisma:migrate': 'pnpm prisma migrate save && pnpm prisma migrate up',
        'prisma:migrate:dev': 'pnpm prisma migrate dev',
        'prisma:migrate:prod': 'pnpm prisma migrate deploy',
        'prisma:reset': 'pnpm prisma migrate reset && pnpm prisma:seed',
        'prisma:seed': 'npx prisma db seed',
        'prisma:studio': 'pnpm prisma studio',
        'generate:models': 'ts-node libs/api/core/data-access/src/scripts/generate-models.ts',
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

      tree.write(packageJsonPath, JSON.stringify(packageJsonContent, null, 2))
      logger.info('✅ Added scripts to package.json')
    }
  } else {
    logger.info('⏭️  Skipping Docker files generation')
  }

  await formatFiles(tree)

  // Handle .env in .gitignore
  if (schema.ignoreEnv) {
    const gitignorePath = '.gitignore'
    if (tree.exists(gitignorePath)) {
      let gitignoreContent = tree.read(gitignorePath, 'utf-8')

      if (!gitignoreContent.includes('.env')) {
        gitignoreContent += '\n.env\n'
        tree.write(gitignorePath, gitignoreContent)
        logger.info('✅ Added .env to .gitignore')
      } else {
        logger.info('ℹ️  .env already exists in .gitignore')
      }
    } else {
      logger.info('⚠️  No .gitignore file found')
    }
  } else {
    logger.info('⏭️  Skipping .env addition to .gitignore')
  }
}
