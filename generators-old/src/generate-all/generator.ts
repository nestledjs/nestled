import { formatFiles, GeneratorCallback, installPackagesTask, Tree } from '@nx/devkit'
import apiAppGenerator from '../api-app/generator'
import apiLibsGenerator from '../api-libs/generator'
import projectConfigGenerator from '../project-config/generator'

async function runGenerators(tree: Tree, schema: { name: string }): Promise<GeneratorCallback> {
  try {
    await apiAppGenerator(tree, { name: 'api' })
    await apiLibsGenerator(tree, {
      useDefaults: true,
      generateAccounts: true,
      generateAuth: true,
      generateMailer: true,
      generateUser: true,
    })
    await projectConfigGenerator(tree, {
      overwritePrettier: true,
      generateEnv: true,
      generateDocker: true,
      ignoreEnv: true,
    })

    // Format files at the end (common practice)
    await formatFiles(tree)

    // Return a function that will run after the generator completes
    // This will install any additional packages that might have been added
    return () => {
      installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error during generator sequence:', error)
    throw error
  }
}

export default function (tree: Tree, schema: { name: string }) {
  return runGenerators(tree, schema)
}
