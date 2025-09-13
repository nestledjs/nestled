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
  [P in keyof T]?: T[P] extends readonly (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends (...args: any[]) => any
    ? T[P]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P]
}