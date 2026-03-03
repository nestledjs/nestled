/**
 * Relation handling code generation for CRUD services.
 *
 * These functions are the canonical source of truth for the relation-mapping
 * logic used in the EJS template (api-crud-data-access.service.ts__tmpl__).
 * The template contains identical copies of these functions so EJS can
 * execute them without external imports.  Any change here MUST be mirrored
 * in the template, and vice versa.
 */

export interface ModelField {
  name: string
  type: string
  kind?: string
  isId?: boolean
  isList: boolean
  isOptional: boolean
  isVirtual?: boolean
  isReadOnly?: boolean
  hasDefaultValue?: boolean
  default?: unknown
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  relationOnDelete?: string
  relationOnUpdate?: string
  isGenerated?: boolean
  isUpdatedAt?: boolean
  documentation?: string
}

export interface ModelLike {
  fields: ModelField[]
}

export interface VirtualRelationField {
  name: string
  type: string
  isList: boolean
  isOptional: boolean
  isVirtual: boolean
  relationName: string
  relatedField: string
}

export interface ForeignKeyRelationField {
  fieldName: string
  relationName: string
  isRequired: boolean
  isList: boolean
}

export function getRelationFields(model: ModelLike): ModelField[] {
  return model.fields.filter((field) => field.relationName && field.relationName.length > 0)
}

export function getVirtualRelationFields(model: ModelLike): VirtualRelationField[] {
  const relationFields = getRelationFields(model)
  const virtualFields: VirtualRelationField[] = []

  relationFields.forEach((relationField) => {
    if (!relationField.relationFromFields || relationField.relationFromFields.length === 0) {
      if (relationField.isList) {
        const virtualFieldName = relationField.name + 'Ids'
        const existingField = model.fields.find(
          (f) => f.name === virtualFieldName && (!f.relationName || f.relationName.length === 0),
        )
        if (!existingField) {
          virtualFields.push({
            name: virtualFieldName,
            type: 'String',
            isList: true,
            isOptional: true,
            isVirtual: true,
            relationName: relationField.relationName!,
            relatedField: relationField.name,
          })
        }
      } else {
        const virtualFieldName = relationField.name + 'Id'
        const existingField = model.fields.find(
          (f) => f.name === virtualFieldName && (!f.relationName || f.relationName.length === 0),
        )
        if (!existingField) {
          virtualFields.push({
            name: virtualFieldName,
            type: 'String',
            isList: false,
            isOptional: true,
            isVirtual: true,
            relationName: relationField.relationName!,
            relatedField: relationField.name,
          })
        }
      }
    }
  })

  return virtualFields
}

export function getForeignKeyRelationFields(model: ModelLike): ForeignKeyRelationField[] {
  const relationFields = getRelationFields(model)
  const foreignKeyFields: ForeignKeyRelationField[] = []

  relationFields.forEach((relationField) => {
    if (relationField.relationFromFields && relationField.relationFromFields.length > 0) {
      relationField.relationFromFields.forEach((fkFieldName) => {
        const fkField = model.fields.find((f) => f.name === fkFieldName)
        if (fkField) {
          foreignKeyFields.push({
            fieldName: fkFieldName,
            relationName: relationField.name,
            isRequired: !fkField.isOptional,
            isList: relationField.isList,
          })
        }
      })
    }
  })

  return foreignKeyFields
}

export function generateRelationHandling(model: ModelLike, operation: 'create' | 'update'): string {
  const virtualRelationFields = getVirtualRelationFields(model)
  const foreignKeyFields = getForeignKeyRelationFields(model)
  const allRelationFields = [...virtualRelationFields, ...foreignKeyFields]

  if (allRelationFields.length === 0) {
    return '    const data = input;'
  }

  let code = '    const { '
  code += virtualRelationFields.map((field) => field.name).join(', ')
  if (foreignKeyFields.length > 0) {
    if (virtualRelationFields.length > 0) code += ', '
    code += foreignKeyFields.map((field) => field.fieldName).join(', ')
  }
  code += ', ...regularFields } = input;\n'
  code += '    const data: any = regularFields;\n\n'

  // Create relation mapping object with field type metadata
  code += '    const relationMappings = {\n'

  // Add virtual relation fields to the mapping
  virtualRelationFields.forEach((field) => {
    code += `      ${field.relatedField}: { ids: ${field.name}, isVirtual: true, isList: ${field.isList} },\n`
  })

  // Add foreign key fields to the mapping
  foreignKeyFields.forEach((field) => {
    code += `      ${field.relationName}: { ids: ${field.fieldName}, isVirtual: false, isList: ${field.isList || false} },\n`
  })

  code += '    };\n\n'

  // Generate the improved iteration logic
  code += '    for (const [relationName, config] of Object.entries(relationMappings)) {\n'
  code += '      if (config.ids !== undefined && config.ids !== null) {\n'
  code += '        const ids = Array.isArray(config.ids) ? config.ids.map(id => ({ id })) : [{ id: config.ids }];\n'
  code += '        \n'
  code += '        if (config.isList) {\n'

  if (operation === 'update') {
    code += '          // List relationships: use set for updates on virtual relations, connect for foreign key relations\n'
    code += "          const relationOperation = config.isVirtual ? 'set' : 'connect';\n"
  } else {
    code += '          // List relationships: always use connect for creates\n'
    code += "          const relationOperation = 'connect';\n"
  }

  code += '          data[relationName] = { [relationOperation]: ids };\n'
  code += '        } else {\n'
  if (operation === 'update') {
    code += '          // Single relationship - connect when an id is provided; disconnect when null on update\n'
  } else {
    code += '          // Single relationship - always use connect\n'
  }
  code += '          data[relationName] = { connect: { id: config.ids } };\n'
  code += '        }\n'
  if (operation === 'update') {
    code += '      } else if (config.ids === null && !config.isList) {\n'
    code += '        // Explicitly null - disconnect the single relationship\n'
    code += '        data[relationName] = { disconnect: true };\n'
    code += '      }\n'
  } else {
    code += '      }\n'
  }
  code += '    }\n'

  return code
}
