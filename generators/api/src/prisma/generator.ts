import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { apiLibraryGenerator, getNpmScope } from '@nestledjs/utils'
import { ApiPrismaGeneratorSchema } from './schema'

export default async function generateLibraries(tree: Tree, options: ApiPrismaGeneratorSchema = {}) {
  const npmScope = getNpmScope(tree)
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  // Create prisma.config.ts at workspace root via template (idempotent)
  if (!tree.exists('prisma.config.ts')) {
    generateFiles(tree, joinPathFragments(templateRootPath, 'config'), '.', { tmpl: '' })
    // Ensure rename from template path to root file name if needed
    if (!tree.exists('prisma.config.ts') && tree.exists('./prisma.config.ts__tmpl__')) {
      tree.rename('./prisma.config.ts__tmpl__', 'prisma.config.ts')
    }
  }

  // Update package.json scripts (remove deprecated prisma fields for v7 - now configured in prisma.config.ts)
  updateJson(tree, 'package.json', (json) => {
    // Remove deprecated prisma.schema field (now in prisma.config.ts)
    if (json.prisma?.schema) {
      delete json.prisma.schema
    }
    // Remove deprecated prisma.seed field (now in prisma.config.ts)
    if (json.prisma?.seed) {
      delete json.prisma.seed
    }
    // Remove empty prisma object if no other properties
    if (json.prisma && Object.keys(json.prisma).length === 0) {
      delete json.prisma
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
    // Add db-update convenience script to regenerate CRUD, models, custom, and SDK
    if (!json.scripts['db-update']) {
      json.scripts['db-update'] =
        `pnpm prisma:generate && nx g @${npmScope}/api:generate-crud && pnpm generate:models && nx g @${npmScope}/api:custom && nx g @${npmScope}/shared:sdk`
    }
    return json
  })

  await apiLibraryGenerator(tree, { name: 'prisma', overwrite }, templateRootPath)

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}
