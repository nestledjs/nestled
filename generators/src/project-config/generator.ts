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

  if (schema.overwritePrettier || !tree.exists('.prettierrc')) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', {
      ...templateOptions,
      dot: '.',
    })
  } else {
    logger.info('.prettierrc already exists and overwrite not specified. Skipping.')
  }

  if (schema.generateEnv) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', {
      ...templateOptions,
      dot: '.',
    })
  }

  if (schema.generateDocker) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', templateOptions)
  }

  await formatFiles(tree)

  if (schema.ignoreEnv) {
    // Add .env to the .gitignore file if not already present
    const gitignorePath = '.gitignore'

    // Check if the .gitignore file exists and add .env
    if (tree.exists(gitignorePath)) {
      let gitignoreContent = tree.read(gitignorePath, 'utf-8')

      if (!gitignoreContent.includes('.env')) {
        gitignoreContent += '\n.env\n' // Add .env to the end of the file
        tree.write(gitignorePath, gitignoreContent)
      }
    }
  }
}
