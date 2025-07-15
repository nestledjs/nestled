import { FormTheme } from './form-theme'
import { createFinalTheme } from './utils/resolve-theme'
import { tailwindTheme } from './themes/tailwind'

/**
 * Complete theme reference showing all available customization properties.
 * 
 * This object demonstrates every theme property you can customize in your forms.
 * Copy this structure and modify the values to create your custom theme.
 * 
 * @example
 * ```typescript
 * import { createFinalTheme, themeReference } from '@nestledjs/forms'
 * 
 * // Use this as a starting point for your custom theme
 * const myTheme = createFinalTheme({
 *   button: {
 *     primary: 'bg-blue-600 text-white hover:bg-blue-700',
 *   },
 *   textField: {
 *     input: 'border-2 border-gray-300 rounded-lg px-4 py-2',
 *   },
 *   // ... other customizations
 * })
 * ```
 */
export const themeReference: FormTheme = tailwindTheme

/**
 * Utility function to generate a theme template JSON string.
 * This creates a JSON representation of the complete theme structure 
 * that you can copy, paste, and modify.
 * 
 * @example
 * ```typescript
 * import { generateThemeTemplate } from '@nestledjs/forms'
 * 
 * // Log the complete theme structure to console
 * console.log(generateThemeTemplate())
 * 
 * // Or save it to a file to use as a starting point
 * const fs = require('fs')
 * fs.writeFileSync('my-theme-template.json', generateThemeTemplate())
 * ```
 */
export function generateThemeTemplate(): string {
  // Create a template based on the actual theme structure with empty strings for easy customization
  function createEmptyTemplate(obj: any): any {
    if (typeof obj === 'string' || obj === null) {
      return ''
    }
    if (typeof obj === 'object' && obj !== null && !obj.$$typeof) { // Exclude React elements
      const result: any = {}
      for (const key in obj) {
        result[key] = createEmptyTemplate(obj[key])
      }
      return result
    }
    return ''
  }
  
  const template = createEmptyTemplate(tailwindTheme)
  return JSON.stringify(template, null, 2)
}

/**
 * Helper function to merge custom theme properties with the base tailwind theme.
 * This is useful when you want to override specific properties while keeping
 * the rest of the tailwind theme intact.
 * 
 * @param customizations - Partial theme object with your customizations
 * @returns Complete theme object ready to use
 * 
 * @example
 * ```typescript
 * import { createCustomTheme } from '@nestledjs/forms'
 * 
 * const myTheme = createCustomTheme({
 *   button: {
 *     primary: 'bg-blue-600 text-white hover:bg-blue-700',
 *   },
 *   selectField: {
 *     input: 'border-2 border-blue-300 rounded-lg',
 *   },
 * })
 * ```
 */
export function createCustomTheme(customizations: Partial<FormTheme>): FormTheme {
  return createFinalTheme(customizations)
} 