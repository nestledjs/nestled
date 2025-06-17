import { formatFiles, installPackagesTask, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { apiLibraryGenerator } from '@nestledjs/utils'
import { ApiPrismaGeneratorSchema } from './schema'

export default async function generateLibraries(tree: Tree, options: ApiPrismaGeneratorSchema = {}) {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  // Update package.json
  updateJson(tree, 'package.json', (json) => {
    // Add prisma schema path
    json.prisma = {
      schema: 'libs/api/prisma/src/lib/schemas',
      seed: 'ts-node --project libs/api/core/models/tsconfig.lib.json libs/api/prisma/src/lib/seed/seed.ts',
    }
    // Add GraphQL model generation script for the 'core' library
    if (!json.scripts) {
      json.scripts = {}
    }
    if (!json.scripts['generate:models']) {
      json.scripts['generate:models'] =
        'ts-node --project libs/api/core/models/tsconfig.lib.json libs/api/core/models/src/lib/generate-models.ts'
    }

    // Add all requested prisma scripts if not already present
    if (!json.scripts['prisma:apply']) {
      json.scripts['prisma:apply'] = 'pnpm prisma:format && pnpm prisma db push'
    }
    if (!json.scripts['prisma:db-push']) {
      json.scripts['prisma:db-push'] = 'pnpm prisma db push'
    }
    if (!json.scripts['prisma:format']) {
      json.scripts['prisma:format'] = 'pnpm prisma format'
    }
    if (!json.scripts['prisma:generate']) {
      json.scripts['prisma:generate'] = 'pnpm prisma generate'
    }
    if (!json.scripts['prisma:migrate']) {
      json.scripts['prisma:migrate'] = 'pnpm prisma migrate save && pnpm prisma migrate up'
    }
    if (!json.scripts['prisma:seed']) {
      json.scripts['prisma:seed'] =
        'ts-node --project libs/api/prisma/tsconfig.lib.json libs/api/prisma/src/lib/seed/seed.ts'
    }
    if (!json.scripts['prisma:studio']) {
      json.scripts['prisma:studio'] = 'pnpm nx prisma:studio api'
    }
    if (!json.scripts['prisma:reset']) {
      json.scripts['prisma:reset'] = 'pnpm prisma migrate reset && pnpm prisma:seed'
    }
    return json
  })

  await apiLibraryGenerator(tree, { name: 'prisma', overwrite }, templateRootPath)

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}
