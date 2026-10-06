import { ModelField, ModelType } from '../lib/engine'

const READ_ONLY_ANNOTATION = /(?:^|\s)@crudReadOnly(?=\s|$)/

/** Keep the read surface intact while sealing every write alias of an annotated field. */
export function markCrudReadOnlyFields(models: ModelType[]): ModelType[] {
  const protectedFields = new Set<string>()
  const key = (model: ModelType, field: ModelField) => `${model.name}.${field.name}`
  for (const model of models) {
    for (const field of model.fields) {
      if (READ_ONLY_ANNOTATION.test(field.documentation ?? '')) protectedFields.add(key(model, field))
    }
  }

  // A relation may also be written through its FK or the other model's virtual ...Id(s).
  // Protect the entire relation when any of these entry points is annotated.
  const relations = new Map<string, string[]>()
  for (const model of models) {
    for (const field of model.fields) {
      if (!field.relationName) continue
      const relationKey = [...[model.name, field.type].sort(), field.relationName].join('.')
      const entries = relations.get(relationKey) ?? []
      entries.push(key(model, field), ...(field.relationFromFields ?? []).map((name) => `${model.name}.${name}`))
      relations.set(relationKey, entries)
    }
  }
  let changed = true
  while (changed) {
    changed = false
    for (const entries of relations.values()) {
      if (!entries.some((entry) => protectedFields.has(entry))) continue
      for (const entry of entries) {
        if (protectedFields.has(entry)) continue
        protectedFields.add(entry)
        changed = true
      }
    }
  }

  return models.map((model) => ({
    ...model,
    fields: model.fields.map((field) =>
      protectedFields.has(key(model, field)) ? { ...field, isCrudReadOnly: true, isReadOnly: true } : field,
    ),
  }))
}
