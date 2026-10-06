import { describe, expect, it } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { generateFiles, joinPathFragments } from '@nx/devkit'
import { ModelField, ModelType, generateDatabaseModelContent } from '../lib/engine'
import { generateFilterInputs } from './filter-inputs'
import { markCrudReadOnlyFields } from './write-fields'

function model(name: string, fields: ModelField[]): ModelType {
  const property = name[0].toLowerCase() + name.slice(1)
  return {
    name,
    modelName: name,
    pluralName: `${name}s`,
    pluralModelName: `${name}s`,
    modelPropertyName: property,
    pluralModelPropertyName: `${property}s`,
    primaryField: 'label',
    fields: [{ name: 'id', type: 'String', kind: 'scalar', isId: true }, ...fields],
  }
}

function render(models: ModelType[]) {
  const tree = createTreeWithEmptyWorkspace()
  const marked = markCrudReadOnlyFields(models)
  const { source: filterInputs, filterInputNames } = generateFilterInputs(marked)
  generateFiles(tree, joinPathFragments(__dirname, 'files/data-access'), 'out', {
    name: 'generated-crud',
    models: marked,
    filterInputs,
    filterInputNames,
    npmScope: 'test',
    tmpl: '',
  })
  return {
    dto: tree.read('out/src/lib/dto/index.ts', 'utf-8')!,
    service: tree.read('out/src/lib/api-crud-data-access.service.ts', 'utf-8')!,
    marked,
  }
}

function input(source: string, name: string) {
  const start = source.indexOf(`export class ${name}`)
  expect(start).toBeGreaterThanOrEqual(0)
  return source.slice(start, source.indexOf('\n}', start))
}

describe('@crudReadOnly', () => {
  it('omits a scalar only from writes, retaining filters, list inputs, and readable metadata', () => {
    const models = [
      model('Record', [
        { name: 'label', type: 'String', kind: 'scalar' },
        { name: 'approved', type: 'Boolean', kind: 'scalar', documentation: '@crudReadOnly', hasDefaultValue: true },
      ]),
    ]
    const { dto, marked } = render(models)
    for (const name of ['CreateRecordInput', 'UpdateRecordInput']) {
      expect(input(dto, name)).not.toContain('approved')
      expect(input(dto, name)).toContain('label')
    }
    expect(input(dto, 'ListRecordInput')).toContain('approved')
    expect(input(dto, 'RecordFilterInput')).toContain('approved')
    expect(marked[0].fields.find((field) => field.name === 'approved')).toMatchObject({
      isReadOnly: true,
      isCrudReadOnly: true,
    })
    expect(generateDatabaseModelContent(marked)).toContain('"approved"')
    expect(models[0].fields[2].isReadOnly).toBeUndefined()
  })

  it.each(['ownerId', 'owner', 'records'])('seals FK and inverse write aliases when %s is annotated', (annotated) => {
    const models = [
      model('Record', [
        { name: 'ownerId', type: 'String', kind: 'scalar', isOptional: true },
        { name: 'owner', type: 'Owner', kind: 'object', relationName: 'RecordOwner', relationFromFields: ['ownerId'] },
      ]),
      model('Owner', [{ name: 'records', type: 'Record', kind: 'object', relationName: 'RecordOwner', isList: true }]),
    ]
    for (const value of models) {
      for (const field of value.fields) {
        if (field.name === annotated) field.documentation = '@crudReadOnly'
      }
    }
    const { dto, service } = render(models)
    for (const prefix of ['Create', 'Update']) {
      expect(input(dto, `${prefix}RecordInput`)).not.toContain('ownerId')
      expect(input(dto, `${prefix}OwnerInput`)).not.toContain('recordsIds')
    }
    expect(input(dto, 'ListRecordInput')).toContain('ownerId')
    expect(service).not.toContain('ids: ownerId')
    expect(service).not.toContain('ids: recordsIds')
  })

  it('matches a standalone annotation, without treating Prisma FK read-only metadata as policy', () => {
    const { dto } = render([
      model('Record', [
        { name: 'ownerId', type: 'String', isReadOnly: true },
        { name: 'label', type: 'String', documentation: '@crudReadOnlyLater' },
      ]),
    ])
    expect(input(dto, 'CreateRecordInput')).toContain('ownerId')
    expect(input(dto, 'CreateRecordInput')).toContain('label')
  })
})
