import { formatFiles, Tree } from '@nx/devkit'
import { libraryGenerator } from '@nx/nest'

interface GeneratorSchema {
  name: string
  appName: string
  dryRun?: boolean
}

async function createLibrary(host: Tree, appName: string, name: string) {
  const directory = `${appName}/${name}`
  await libraryGenerator(host, { name: 'data-access', directory, tags: `scope:${appName},type:data-access` })
  await libraryGenerator(host, { name: 'feature', directory, tags: `scope:${appName},type:feature` })
}

export default async function (host: Tree, schema: GeneratorSchema) {
  if (!schema.name) {
    throw new Error('Name is required')
  }

  if (!schema.appName) {
    throw new Error('App name is required')
  }

  const appName: string = schema.appName
  await createLibrary(host, appName, schema.name)
  await formatFiles(host)
}
