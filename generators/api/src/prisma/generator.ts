import { formatFiles, installPackagesTask, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { apiLibraryGenerator } from '@nestled/utils'
import { ApiPrismaGeneratorSchema } from './schema'

export default async function generateLibraries(tree: Tree, options: ApiPrismaGeneratorSchema = {}) {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  // Update package.json
  updateJson(tree, 'package.json', (json) => {
    // Add prisma schema path
    json.prisma = {
      schema: 'libs/api/prisma/src/lib/schemas',
      seed: 'ts-node libs/api/prisma/src/lib/seed/seed.ts',
    }
    // Add GraphQL model generation script for the 'core' library
    if (!json.scripts) {
      json.scripts = {}
    }
    if (!json.scripts['generate:models']) {
      json.scripts['generate:models'] = 'ts-node libs/api/core/data-access/src/scripts/generate-models.ts'
    }
    return json
  })

  await apiLibraryGenerator(tree, { name: 'prisma', overwrite }, templateRootPath)

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}
