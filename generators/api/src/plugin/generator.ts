import { formatFiles, installPackagesTask, Tree } from '@nx/devkit'
import { join } from 'path'
import { GeneratePluginGeneratorSchema } from './schema'

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function toPascalCase(str: string): string {
  return str
    .replace(/(^\w|[-_\s]\w)/g, (match) => match.replace(/[-_\s]/, '').toUpperCase())
}

async function ensureDirExists(tree: Tree, path: string) {
  if (!tree.exists(path)) {
    // Directory will be created when a file is written into it
  }
}

export default async function (tree: Tree, schema: GeneratePluginGeneratorSchema) {
  const name = schema.name
  if (!name) throw new Error('Name is required')
  const kebabName = toKebabCase(name)
  const className = toPascalCase(name)
  const customLibraryRoot = schema.directory ? `libs/api/${schema.directory}/custom` : `libs/api/custom`
  const pluginsDir = join(customLibraryRoot, 'src/lib/plugins')
  const pluginFolder = join(pluginsDir, kebabName)

  await ensureDirExists(tree, pluginsDir)
  await ensureDirExists(tree, pluginFolder)

  // Service
  const serviceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ${className}Service {
  // Add your service logic here
}
`
  tree.write(join(pluginFolder, `${kebabName}.service.ts`), serviceContent)

  // Resolver
  const resolverContent = `import { Resolver } from '@nestjs/graphql'
import { Injectable } from '@nestjs/common'

@Resolver()
@Injectable()
export class ${className}Resolver {
  // Add your resolver logic here
}
`
  tree.write(join(pluginFolder, `${kebabName}.resolver.ts`), resolverContent)

  // Module
  const moduleContent = `import { Module } from '@nestjs/common'
import { ${className}Service } from './${kebabName}.service'
import { ${className}Resolver } from './${kebabName}.resolver'

@Module({
  providers: [${className}Service, ${className}Resolver],
  exports: [${className}Service, ${className}Resolver],
})
export class ${className}Module {}
`
  tree.write(join(pluginFolder, `${kebabName}.module.ts`), moduleContent)

  await formatFiles(tree)
  return () => {
    installPackagesTask(tree)
  }
} 