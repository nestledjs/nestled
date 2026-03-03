import { describe, expect, it } from 'vitest'
import {
  generateRelationHandling,
  getForeignKeyRelationFields,
  getRelationFields,
  getVirtualRelationFields,
  type ModelLike,
} from './relation-handling'

// Model with an optional single FK relation (Event -> Location via locationId)
const modelWithOptionalSingleRelation: ModelLike = {
  fields: [
    { name: 'id', type: 'String', isId: true, isList: false, isOptional: false, hasDefaultValue: true },
    { name: 'name', type: 'String', isList: false, isOptional: false },
    { name: 'locationId', type: 'String', isList: false, isOptional: true },
    {
      name: 'location',
      type: 'Location',
      kind: 'object',
      isList: false,
      isOptional: true,
      relationName: 'EventToLocation',
      relationFromFields: ['locationId'],
    },
  ],
}

// Model with a virtual list relation (Event -> Tags, many-to-many without FK)
const modelWithVirtualListRelation: ModelLike = {
  fields: [
    { name: 'id', type: 'String', isId: true, isList: false, isOptional: false, hasDefaultValue: true },
    { name: 'name', type: 'String', isList: false, isOptional: false },
    {
      name: 'tags',
      type: 'Tag',
      kind: 'object',
      isList: true,
      isOptional: true,
      relationName: 'EventToTag',
      relationFromFields: [],
    },
  ],
}

// Model with both FK single relation and virtual list relation
const modelWithMixedRelations: ModelLike = {
  fields: [
    { name: 'id', type: 'String', isId: true, isList: false, isOptional: false, hasDefaultValue: true },
    { name: 'name', type: 'String', isList: false, isOptional: false },
    { name: 'locationId', type: 'String', isList: false, isOptional: true },
    {
      name: 'location',
      type: 'Location',
      kind: 'object',
      isList: false,
      isOptional: true,
      relationName: 'EventToLocation',
      relationFromFields: ['locationId'],
    },
    {
      name: 'tags',
      type: 'Tag',
      kind: 'object',
      isList: true,
      isOptional: true,
      relationName: 'EventToTag',
      relationFromFields: [],
    },
  ],
}

// Model with a required single FK relation (Post -> Author via authorId, non-optional)
const modelWithRequiredSingleRelation: ModelLike = {
  fields: [
    { name: 'id', type: 'String', isId: true, isList: false, isOptional: false, hasDefaultValue: true },
    { name: 'title', type: 'String', isList: false, isOptional: false },
    { name: 'authorId', type: 'String', isList: false, isOptional: false },
    {
      name: 'author',
      type: 'User',
      kind: 'object',
      isList: false,
      isOptional: false,
      relationName: 'PostToUser',
      relationFromFields: ['authorId'],
    },
  ],
}

// Model with no relations
const modelWithNoRelations: ModelLike = {
  fields: [
    { name: 'id', type: 'String', isId: true, isList: false, isOptional: false, hasDefaultValue: true },
    { name: 'name', type: 'String', isList: false, isOptional: false },
  ],
}

describe('relation-handling', () => {
  describe('getRelationFields', () => {
    it('returns fields with non-empty relationName', () => {
      const result = getRelationFields(modelWithOptionalSingleRelation)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('location')
    })

    it('returns empty array for model without relations', () => {
      expect(getRelationFields(modelWithNoRelations)).toHaveLength(0)
    })
  })

  describe('getVirtualRelationFields', () => {
    it('generates virtual field for relation without explicit FK', () => {
      const result = getVirtualRelationFields(modelWithVirtualListRelation)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'tagsIds',
        isList: true,
        isVirtual: true,
        relatedField: 'tags',
      })
    })

    it('does not generate virtual field for relation with explicit FK', () => {
      const result = getVirtualRelationFields(modelWithOptionalSingleRelation)
      expect(result).toHaveLength(0)
    })
  })

  describe('getForeignKeyRelationFields', () => {
    it('returns FK field metadata for relation with explicit FK', () => {
      const result = getForeignKeyRelationFields(modelWithOptionalSingleRelation)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        fieldName: 'locationId',
        relationName: 'location',
        isList: false,
      })
    })

    it('returns empty array for virtual relations', () => {
      expect(getForeignKeyRelationFields(modelWithVirtualListRelation)).toHaveLength(0)
    })
  })

  describe('generateRelationHandling', () => {
    it('returns simple assignment when model has no relations', () => {
      const result = generateRelationHandling(modelWithNoRelations, 'update')
      expect(result).toBe('    const data = input;')
    })

    describe('update operation - single FK relation', () => {
      it('includes disconnect branch for explicit null on optional single relation', () => {
        const result = generateRelationHandling(modelWithOptionalSingleRelation, 'update')
        expect(result).toContain('} else if (config.ids === null && !config.isList && !config.isRequired) {')
        expect(result).toContain('data[relationName] = { disconnect: true }')
      })

      it('includes connect logic for non-null values', () => {
        const result = generateRelationHandling(modelWithOptionalSingleRelation, 'update')
        expect(result).toContain('data[relationName] = { connect: { id: config.ids } }')
      })

      it('includes updated comment about connect/disconnect behavior', () => {
        const result = generateRelationHandling(modelWithOptionalSingleRelation, 'update')
        expect(result).toContain('connect when an id is provided; disconnect when null on update')
      })
    })

    describe('create operation - single FK relation', () => {
      it('does NOT include disconnect branch', () => {
        const result = generateRelationHandling(modelWithOptionalSingleRelation, 'create')
        expect(result).not.toContain('disconnect')
      })

      it('includes connect logic for non-null values', () => {
        const result = generateRelationHandling(modelWithOptionalSingleRelation, 'create')
        expect(result).toContain('data[relationName] = { connect: { id: config.ids } }')
      })

      it('uses the original "always use connect" comment', () => {
        const result = generateRelationHandling(modelWithOptionalSingleRelation, 'create')
        expect(result).toContain('Single relationship - always use connect')
      })
    })

    describe('update operation - virtual list relation', () => {
      it('guards disconnect branch so it cannot fire for list relations', () => {
        const result = generateRelationHandling(modelWithVirtualListRelation, 'update')
        // The disconnect branch is present but guarded by !config.isList && !config.isRequired
        expect(result).toContain('config.ids === null && !config.isList && !config.isRequired')
        // The relation mapping sets isList: true, so the guard prevents disconnect at runtime
        expect(result).toContain('tags: { ids: tagsIds, isVirtual: true, isList: true, isRequired: false }')
      })

      it('uses set operation for virtual list relations on update', () => {
        const result = generateRelationHandling(modelWithVirtualListRelation, 'update')
        expect(result).toContain("config.isVirtual ? 'set' : 'connect'")
      })
    })

    describe('mixed relations (single FK + virtual list)', () => {
      it('includes disconnect branch only for optional single relations on update', () => {
        const result = generateRelationHandling(modelWithMixedRelations, 'update')
        // Disconnect branch is present but guarded by isRequired check
        expect(result).toContain('} else if (config.ids === null && !config.isList && !config.isRequired) {')
        expect(result).toContain('data[relationName] = { disconnect: true }')
      })

      it('destructures both virtual and FK fields from input', () => {
        const result = generateRelationHandling(modelWithMixedRelations, 'update')
        expect(result).toContain('tagsIds, locationId, ...regularFields')
      })

      it('creates relation mappings for both relation types with isRequired metadata', () => {
        const result = generateRelationHandling(modelWithMixedRelations, 'update')
        expect(result).toContain('tags: { ids: tagsIds, isVirtual: true, isList: true, isRequired: false }')
        expect(result).toContain('location: { ids: locationId, isVirtual: false, isList: false, isRequired: false }')
      })
    })

    describe('update operation - required single FK relation', () => {
      it('does not allow disconnect for required relations at runtime', () => {
        const result = generateRelationHandling(modelWithRequiredSingleRelation, 'update')
        // The mapping marks the relation as isRequired: true
        expect(result).toContain('author: { ids: authorId, isVirtual: false, isList: false, isRequired: true }')
        // The disconnect guard includes !config.isRequired, so required relations cannot disconnect
        expect(result).toContain('!config.isRequired')
      })

      it('still allows connect for required relations', () => {
        const result = generateRelationHandling(modelWithRequiredSingleRelation, 'update')
        expect(result).toContain('data[relationName] = { connect: { id: config.ids } }')
      })
    })
  })
})
