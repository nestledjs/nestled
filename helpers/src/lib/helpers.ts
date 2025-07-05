import pluralize from 'pluralize'

/**
 * A utility type that makes all properties of a type and its nested objects optional recursively.
 * Useful for creating partial versions of complex nested objects.
 * 
 * This version properly handles:
 * - Arrays: Makes array elements deeply partial while preserving array structure
 * - Functions: Leaves functions unchanged (they shouldn't be made partial)
 * - Objects: Makes nested objects deeply partial
 * - Primitives: Makes primitive values optional
 * 
 * @template T - The type to make deeply partial
 * @example
 * ```typescript
 * interface User {
 *   name: string
 *   hobbies: string[]
 *   friends: User[]
 *   onClick: () => void
 *   profile: {
 *     age: number
 *     address: {
 *       street: string
 *       city: string
 *     }
 *   }
 * }
 * 
 * type PartialUser = DeepPartial<User>
 * // Result:
 * // {
 * //   name?: string
 * //   hobbies?: string[]
 * //   friends?: DeepPartial<User>[]
 * //   onClick?: () => void
 * //   profile?: {
 * //     age?: number
 * //     address?: {
 * //       street?: string
 * //       city?: string
 * //     }
 * //   }
 * // }
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends (...args: any[]) => any
    ? T[P]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P]
}

/**
 * List of uncountable nouns that the pluralize library incorrectly pluralizes.
 * These words should remain the same in plural form, so we append "List" instead.
 */
const UNCOUNTABLE_OVERRIDES = new Set([
  'luggage',
  'furniture',
  'advice',
  'research',
  'progress',
  'homework',
  'housework',
  'software',
  'hardware',
  'traffic',
  'weather',
  'news',
  'evidence',
  'feedback',
  'knowledge',
  'music',
  'art',
  'love',
  'happiness',
  'anger',
  'beauty',
  'courage',
  'wisdom'
])

/**
 * Pluralizes a word using the pluralize library, with special handling for words
 * where the singular and plural forms are the same (like "data", "sheep").
 * In those cases, appends "List" to make it clear it's a collection.
 * Also includes overrides for known uncountable nouns that the pluralize library
 * incorrectly pluralizes.
 * 
 * @param name - The word to pluralize
 * @returns The pluralized form, or the word + "List" if singular equals plural or is uncountable
 * 
 * @example
 * ```typescript
 * getPluralName('user')     // 'users'
 * getPluralName('category') // 'categories'
 * getPluralName('data')     // 'dataList' (because 'data' plural is also 'data')
 * getPluralName('sheep')    // 'sheepList' (because 'sheep' plural is also 'sheep')
 * getPluralName('luggage')  // 'luggageList' (override: pluralize incorrectly returns 'luggages')
 * getPluralName('furniture') // 'furnitureList' (override: pluralize incorrectly returns 'furnitures')
 * ```
 */
export function getPluralName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('getPluralName: name must be a non-empty string')
  }
  
  // Check if this is a known uncountable noun that pluralize incorrectly handles
  if (UNCOUNTABLE_OVERRIDES.has(name.toLowerCase())) {
    return name + 'List'
  }
  
  const plural = pluralize(name)
  return plural === name ? name + 'List' : plural
}
