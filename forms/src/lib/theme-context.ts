import { createContext, useContext } from 'react'
import { FormTheme, FormThemeSchema } from './form-theme'

// --- THIS IS THE FIX ---
// Create the default theme by parsing an empty object.
// Zod will automatically fill in all the default values we defined in the schema.
// This object has NO dependencies on `tailwindTheme` or `createFinalTheme`.
const defaultTheme = FormThemeSchema.parse({})

// Provide this simple, dependency-free object as the context's default value.
export const ThemeContext = createContext<FormTheme>(defaultTheme)

/**
 * Hook to access the current form theme within a Form component.
 * 
 * Provides access to the fully resolved theme object with CSS classes
 * for all form field types and states. The theme includes default values
 * merged with any custom theme overrides passed to the Form component.
 * 
 * Must be used within a Form component.
 * 
 * @returns The complete form theme object with CSS classes for all field types
 * 
 * @example
 * ```tsx
 * function CustomStyledField() {
 *   const theme = useFormTheme()
 *   
 *   return (
 *     <input
 *       type="text"
 *       className={`${theme.textField.input} ${theme.textField.focus}`}
 *     />
 *   )
 * }
 * 
 * // Usage within a Form with custom theme
 * <Form 
 *   id="my-form" 
 *   theme={{ textField: { input: 'custom-input-class' } }}
 *   submit={handleSubmit}
 * >
 *   <CustomStyledField />
 * </Form>
 * ```
 */
export function useFormTheme() {
  return useContext(ThemeContext)
}
