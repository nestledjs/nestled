import { formatFiles, Tree } from '@nx/devkit'
import { libraryGenerator } from '@nx/react'

interface CreateLibrarySchema {
  name: string
  appName?: string
  dryRun?: boolean
}

async function createLibrary(host: Tree, schema: CreateLibrarySchema) {
  if (!schema.name) {
    throw new Error('Name is required')
  }

  const appName = schema.appName || 'web'
  const directory = `${appName}/${schema.name}`
  await libraryGenerator(host, {
    name: 'data-access',
    directory,
    tags: `scope:${appName},type:data-access`,
    linter: 'eslint',
    style: 'none',
  })
  await libraryGenerator(host, {
    name: 'feature',
    directory,
    tags: `scope:${appName},type:feature`,
    linter: 'eslint',
    style: 'none',
  })
  await libraryGenerator(host, {
    name: 'ui',
    directory,
    tags: `scope:${appName},type:feature`,
    linter: 'eslint',
    style: 'none',
  })
}

export default async function (host: Tree, schema: CreateLibrarySchema) {
  try {
    await createLibrary(host, schema)
    await formatFiles(host)
  } catch (error) {
    console.error(error.message)
  }
}
