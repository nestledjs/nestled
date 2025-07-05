import { getPluralName } from './helpers'
import { vi } from 'vitest'

describe('getPluralName', () => {
  describe('normal pluralization', () => {
    it('should pluralize regular nouns', () => {
      expect(getPluralName('user')).toBe('users')
      expect(getPluralName('book')).toBe('books')
      expect(getPluralName('car')).toBe('cars')
      expect(getPluralName('house')).toBe('houses')
    })

    it('should pluralize nouns ending in -y', () => {
      expect(getPluralName('category')).toBe('categories')
      expect(getPluralName('company')).toBe('companies')
      expect(getPluralName('country')).toBe('countries')
    })

    it('should pluralize nouns ending in -s, -sh, -ch, -x, -z', () => {
      expect(getPluralName('class')).toBe('classes')
      expect(getPluralName('dish')).toBe('dishes')
      expect(getPluralName('church')).toBe('churches')
      expect(getPluralName('box')).toBe('boxes')
      expect(getPluralName('buzz')).toBe('buzzes')
    })

    it('should pluralize nouns ending in -f or -fe', () => {
      expect(getPluralName('leaf')).toBe('leaves')
      expect(getPluralName('knife')).toBe('knives')
      expect(getPluralName('life')).toBe('lives')
    })

    it('should pluralize nouns ending in -o', () => {
      expect(getPluralName('hero')).toBe('heroes')
      expect(getPluralName('potato')).toBe('potatoes')
      expect(getPluralName('tomato')).toBe('tomatoes')
    })
  })

  describe('irregular pluralization', () => {
    it('should handle irregular nouns', () => {
      expect(getPluralName('child')).toBe('children')
      expect(getPluralName('person')).toBe('people')
      expect(getPluralName('mouse')).toBe('mice')
      expect(getPluralName('foot')).toBe('feet')
    })
  })

  describe('same singular and plural forms', () => {
    it('should add "List" when singular equals plural', () => {
      expect(getPluralName('data')).toBe('dataList')
      expect(getPluralName('sheep')).toBe('sheepList')
      expect(getPluralName('fish')).toBe('fishList')
      expect(getPluralName('deer')).toBe('deerList')
    })

    it('should handle uncountable nouns with correct overrides', () => {
      // These are incorrectly pluralized by the pluralize library, so we override them
      expect(getPluralName('luggage')).toBe('luggageList')
      expect(getPluralName('furniture')).toBe('furnitureList')
      expect(getPluralName('advice')).toBe('adviceList')
      expect(getPluralName('research')).toBe('researchList')
      expect(getPluralName('software')).toBe('softwareList')
      expect(getPluralName('hardware')).toBe('hardwareList')
      expect(getPluralName('traffic')).toBe('trafficList')
      expect(getPluralName('weather')).toBe('weatherList')
      expect(getPluralName('news')).toBe('newsList')
      expect(getPluralName('evidence')).toBe('evidenceList')
      expect(getPluralName('feedback')).toBe('feedbackList')
      expect(getPluralName('knowledge')).toBe('knowledgeList')
      expect(getPluralName('music')).toBe('musicList')
    })

    it('should handle mass nouns that are naturally uncountable', () => {
      expect(getPluralName('information')).toBe('informationList')
      expect(getPluralName('equipment')).toBe('equipmentList')
    })
  })

  describe('edge cases', () => {
    it('should handle empty or invalid input', () => {
      expect(() => getPluralName('')).toThrow('getPluralName: name must be a non-empty string')
      expect(() => getPluralName(null as any)).toThrow('getPluralName: name must be a non-empty string')
      expect(() => getPluralName(undefined as any)).toThrow('getPluralName: name must be a non-empty string')
      expect(() => getPluralName(123 as any)).toThrow('getPluralName: name must be a non-empty string')
    })

    it('should handle single characters', () => {
      expect(getPluralName('a')).toBe('as')
      // Note: pluralize library treats "I" as a special case and returns "WE"
      expect(getPluralName('I')).toBe('WE')
    })

    it('should handle technical terms', () => {
      // Note: pluralize library converts all-caps acronyms to all-caps plurals
      expect(getPluralName('API')).toBe('APIS')
      expect(getPluralName('URL')).toBe('URLS')
      expect(getPluralName('UUID')).toBe('UUIDS')
      expect(getPluralName('config')).toBe('configs')
      // Note: pluralize library uses the Latin plural "schemata" for "schema"
      expect(getPluralName('schema')).toBe('schemata')
      expect(getPluralName('index')).toBe('indices')
    })

    it('should handle case sensitivity for overrides', () => {
      expect(getPluralName('Luggage')).toBe('LuggageList')
      expect(getPluralName('FURNITURE')).toBe('FURNITUREList')
      expect(getPluralName('Software')).toBe('SoftwareList')
    })

    it('should handle long words', () => {
      expect(getPluralName('internationalization')).toBe('internationalizations')
      expect(getPluralName('supercalifragilisticexpialidocious')).toBe('supercalifragilisticexpialidociousList')
    })

    it('should be consistent with repeated calls', () => {
      const word = 'user'
      const result1 = getPluralName(word)
      const result2 = getPluralName(word)
      expect(result1).toBe(result2)
      expect(result1).toBe('users')
    })
  })

  describe('capitalization handling', () => {
    it('should handle capitalized words', () => {
      expect(getPluralName('User')).toBe('Users')
      expect(getPluralName('Category')).toBe('Categories')
      expect(getPluralName('Data')).toBe('DataList')
    })

    it('should handle camelCase words', () => {
      expect(getPluralName('userProfile')).toBe('userProfiles')
      expect(getPluralName('productCategory')).toBe('productCategories')
    })

    it('should handle PascalCase words', () => {
      expect(getPluralName('UserProfile')).toBe('UserProfiles')
      expect(getPluralName('ProductCategory')).toBe('ProductCategories')
    })
  })

  describe('real-world examples', () => {
    it('should handle common database model names', () => {
      expect(getPluralName('user')).toBe('users')
      expect(getPluralName('product')).toBe('products')
      expect(getPluralName('order')).toBe('orders')
      expect(getPluralName('invoice')).toBe('invoices')
      expect(getPluralName('address')).toBe('addresses')
      expect(getPluralName('payment')).toBe('payments')
      expect(getPluralName('notification')).toBe('notifications')
      expect(getPluralName('subscription')).toBe('subscriptions')
    })

    it('should handle business domain terms', () => {
      expect(getPluralName('analysis')).toBe('analyses')
      expect(getPluralName('thesis')).toBe('theses')
      expect(getPluralName('criterion')).toBe('criteria')
      expect(getPluralName('phenomenon')).toBe('phenomena')
    })
  })
})

// Type testing for DeepPartial (these are compile-time tests)
describe('DeepPartial type', () => {
  it('should compile without errors for nested objects', () => {
    interface TestInterface {
      name: string
      nested: {
        value: number
      }
    }
    
    // This should compile without errors
    const partial: import('./helpers').DeepPartial<TestInterface> = {
      name: 'test',
      nested: {
        value: 42
      }
    }
    
    expect(partial).toBeDefined()
  })

  it('should handle arrays correctly', () => {
    interface WithArrays {
      names: string[]
      users: { id: number; name: string }[]
      numbers: number[]
    }
    
    // Arrays should be preserved but elements can be partial
    const partial: import('./helpers').DeepPartial<WithArrays> = {
      names: ['test'],
      users: [{ id: 1 }], // name is optional due to DeepPartial
      numbers: [1, 2, 3]
    }
    
    expect(partial).toBeDefined()
    expect(Array.isArray(partial.names)).toBe(true)
    expect(Array.isArray(partial.users)).toBe(true)
  })

  it('should handle functions correctly', () => {
    interface WithFunctions {
      name: string
      onClick: () => void
      onSubmit: (data: any) => Promise<void>
      calculate: (a: number, b: number) => number
    }
    
    const mockFn = vi.fn()
    const mockSubmit = vi.fn()
    const mockCalculate = vi.fn()
    
    // Functions should be preserved exactly as-is
    const partial: import('./helpers').DeepPartial<WithFunctions> = {
      onClick: mockFn,
      onSubmit: mockSubmit,
      calculate: mockCalculate
      // name is optional and omitted
    }
    
    expect(partial.onClick).toBe(mockFn)
    expect(partial.onSubmit).toBe(mockSubmit)
    expect(partial.calculate).toBe(mockCalculate)
  })

  it('should handle complex nested structures with arrays and functions', () => {
    interface ComplexInterface {
      user: {
        name: string
        hobbies: string[]
        friends: { name: string; age: number }[]
        settings: {
          theme: string
          callbacks: {
            onSave: () => void
            onLoad: (data: any) => void
          }
        }
      }
    }
    
    const mockSave = vi.fn()
    const mockLoad = vi.fn()
    
    const partial: import('./helpers').DeepPartial<ComplexInterface> = {
      user: {
        hobbies: ['reading'],
        friends: [{ name: 'Alice' }], // age is optional
        settings: {
          callbacks: {
            onSave: mockSave,
            onLoad: mockLoad
          }
          // theme is optional
        }
      }
    }
    
    expect(partial.user?.hobbies).toEqual(['reading'])
    expect(partial.user?.friends?.[0]?.name).toBe('Alice')
    expect(partial.user?.settings?.callbacks?.onSave).toBe(mockSave)
  })
})
