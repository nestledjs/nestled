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

interface ApiLibAccountGeneratorSchema {
  name: string
  directory: string
}

async function apiAccountGenerator(tree: Tree, schema: ApiLibAccountGeneratorSchema, type: string) {
  if (!schema.name) {
    throw new Error('Name is required')
  }

  if (!schema.directory) {
    throw new Error('Directory is required')
  }

  const filePath = `${schema.directory}/${type}`
  const libraryName = `api-${schema.name}-${type}`

  await libraryGenerator(tree, {
    name: libraryName,
    directory: filePath,
    tags: `scope:${schema.directory},type:${type}`,
  })
  const libraryRoot = readProjectConfiguration(tree, libraryName).root

  const npmScope = readJson(tree, 'nx.json').npmScope

  const variables = {
    ...schema,
    ...names(schema.directory),
    npmScope,
    tmpl: '',
  }

  generateFiles(
    tree, // the virtual file system
    joinPathFragments(__dirname, `./files/${type}`), // path to the file templates
    libraryRoot, // destination path of the files
    variables, // config object to replace variable in file templates
  )
  await formatFiles(tree)
  return () => {
    installPackagesTask(tree)
  }
}

export default async function generateAccountLibraries(tree: Tree, schema: ApiLibAccountGeneratorSchema) {
  await apiAccountGenerator(tree, schema, 'data-access'); // First call
  await apiAccountGenerator(tree, schema, 'feature'); // Second call
}
