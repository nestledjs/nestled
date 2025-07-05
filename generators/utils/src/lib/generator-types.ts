import { Tree } from '@nx/devkit'

export interface CrudAuthConfig {
  readOne?: string
  readMany?: string
  count?: string
  create?: string
  update?: string
  delete?: string
}

export interface ModelField {
  name: string
  type: string
  isOptional?: boolean
  isId?: boolean
  isUnique?: boolean
  isList?: boolean
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
  [key: string]: unknown
}

export interface ModelType {
  name: string
  pluralName: string
  fields: ModelField[]
  primaryField: string
  modelName: string
  modelPropertyName: string
  pluralModelName: string
  pluralModelPropertyName: string
  auth?: CrudAuthConfig
}

export interface GenerateTemplateOptions {
  tree: Tree
  schema: unknown
  libraryRoot: string
  templatePath: string
  npmScope: string
}

export interface AddToModulesOptions {
  tree: Tree
  modulePath: string
  moduleArrayName: string
  moduleToAdd: string
  importPath: string
}

export interface ApiLibraryGeneratorSchema {
  name: string
  overwrite?: boolean
  linter?: 'eslint'
  unitTestRunner?: 'vitest'
  models?: ModelType[]
}
