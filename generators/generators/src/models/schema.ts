export interface GenerateModelsGeneratorSchema {
  /**
   * Directory (relative to the workspace root) where models.ts, enums.ts and index.ts are written.
   * Defaults to libs/api/core/models/src/lib/models.
   */
  outputPath?: string
  /**
   * Import path for the generated Prisma client wrapper that re-exports enums.
   * When omitted, it is resolved from the tsconfig.base.json path alias that maps to
   * libs/api/prisma/src/index.ts.
   */
  prismaImportPath?: string
}
