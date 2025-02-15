import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  names,
  readJson,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit'
import { libraryGenerator } from '@nx/nest/src/generators/library/library'
import { ApiLibAccountGeneratorSchema } from './schema'

export default async function (tree: Tree, schema: ApiLibAccountGeneratorSchema) {
  const directory = schema.directory || 'libs/api/account'

  if (!directory) {
    throw new Error('Directory is required')
  }

  const type = 'feature'
  
  // Create project name according to Nx 20 format
  const projectName = `api-account-${type}`
  const projectRoot = `${directory}/${type}`
  
  await libraryGenerator(tree, {
    name: projectName,
    directory: projectRoot,
    tags: `scope:${directory},type:${type}`,
  })

  const libraryRoot = readProjectConfiguration(tree, projectName).root

  const npmScope = readJson(tree, 'nx.json').npmScope

  const variables = {
    ...schema,
    ...names(directory),
    npmScope,
    tmpl: '',
  }
  await generateFiles(
    tree,
    joinPathFragments(__dirname, `./files/${type}`),
    libraryRoot,
    variables,
  )
  await formatFiles(tree)
  return () => {
    installPackagesTask(tree)
  }
}
