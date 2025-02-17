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
        'docker:build': 'docker build . -t muzebook/api',
        'docker:down': 'docker compose down',
        'docker:push': 'docker push muzebook/api',
        'docker:run': 'docker run -it -p 8000:3000 muzebook/api',
        'docker:up': 'docker compose up',
      }

      tree.write(packageJsonPath, JSON.stringify(packageJsonContent, null, 2))
      logger.info('✅ Added Docker scripts to package.json')
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
