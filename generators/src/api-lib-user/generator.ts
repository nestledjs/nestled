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

interface ApiLibUserGeneratorSchema {
  name: string
  directory: string
}

async function apiUserGenerator(tree: Tree, schema: ApiLibUserGeneratorSchema, type: string) {
  if (!schema.name) {
    throw new Error('Name is required')
  }

  if (!schema.directory) {
    throw new Error('Directory is required')
  }

  const filePath = `${schema.directory}/user`
  await libraryGenerator(tree, {
    name: type,
    directory: filePath,
    tags: `scope:${schema.directory},type:${type}`,
  })
  const libraryRoot = readProjectConfiguration(tree, `${schema.directory}-user-${type}`).root
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

export default async function (tree: Tree, schema: ApiLibUserGeneratorSchema) {
  if (!schema.name) {
    throw new Error('Name is required')
  }

  if (!schema.directory) {
    throw new Error('Directory is required')
  }

  await apiUserGenerator(tree, schema, 'data-access')
  await apiUserGenerator(tree, schema, 'feature')
}
