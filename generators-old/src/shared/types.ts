import { Tree } from '@nx/devkit'

export interface CrudAuthConfig {
  readOne?: string
  readMany?: string
  count?: string
  create?: string
  update?: string
  delete?: string
}

export interface ModelType {
  name: string
  pluralName: string
  fields: Array<{ name: string; type: string }>
  primaryField: string
  modelName: string
  modelPropertyName: string
  pluralModelName: string
  pluralModelPropertyName: string
  auth?: CrudAuthConfig
}

export async function getAllPrismaModels(tree: Tree): Promise<ModelType[]> {
  const { getDMMF } = await import('@prisma/internals')
  const { getPrismaSchemaPath, readPrismaSchema } = await import('./utils.js')
  const pluralize = (await import('pluralize')).default
  
  const prismaPath = getPrismaSchemaPath(tree)
  const prismaSchema = readPrismaSchema(tree, prismaPath)
  
  if (!prismaSchema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return []
  }

  try {
    const dmmf = await getDMMF({ datamodel: prismaSchema })
    
    return dmmf.datamodel.models.map((model) => {
      const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1)
      const pluralPropertyName = pluralize(singularPropertyName)
      
      // Create a properly typed fields array
      const fields = model.fields.map((field) => ({
        name: field.name,
        type: field.type,
        isId: field.isId,
        isRequired: field.isRequired,
        isList: field.isList,
        isUnique: field.isUnique,
        isReadOnly: field.isReadOnly,
        isUpdatedAt: field.isUpdatedAt,
        kind: field.kind,
        relationName: field.relationName,
        relationToFields: field.relationToFields || [],
        relationOnDelete: field.relationOnDelete,
        default: field.default,
      }))

      // Extract auth configuration from model documentation
      const authConfig = model.documentation
        ? parseCrudAuth(model.documentation)
        : null

      return {
        name: model.name,
        pluralName: pluralize(model.name),
        fields,
        primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelName: pluralize(model.name),
        pluralModelPropertyName: pluralPropertyName,
        auth: authConfig || undefined,
      }
    })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

function parseCrudAuth(comment: string): CrudAuthConfig | null {
  try {
    // Match @crudAuth: { ... } in a single line
    const match = comment.match(/@crudAuth:\s*(\{.*\})/)
    if (!match) return null

    // The captured group should be valid JSON
    return JSON.parse(match[1])
  } catch (e) {
    console.error('Error parsing @crudAuth:', e)
    return null
  }
}
