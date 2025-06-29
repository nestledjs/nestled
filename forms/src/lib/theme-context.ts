import { createContext, useContext } from 'react'
import { FormTheme, FormThemeSchema } from './form-theme'

// --- THIS IS THE FIX ---
// Create the default theme by parsing an empty object.
// Zod will automatically fill in all the default values we defined in the schema.
// This object has NO dependencies on `tailwindTheme` or `createFinalTheme`.
const defaultTheme = FormThemeSchema.parse({})

// Provide this simple, dependency-free object as the context's default value.
export const ThemeContext = createContext<FormTheme>(defaultTheme)

export function useFormTheme() {
  return useContext(ThemeContext)
}
