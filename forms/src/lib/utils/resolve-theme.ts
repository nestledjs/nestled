import { merge } from 'lodash-es'
import clsx from 'clsx'
import { FormTheme, FormThemeSchema } from '../form-theme'
import { tailwindTheme } from '@nestledjs/forms'

/**
 * Creates the final, fully resolved theme for the entire form. This is the
 * single source of truth for theme processing, called once within the <Form> component.
 *
 * It performs a two-step process:
 * 1. Deeply merges the user-provided `userTheme` on top of the `tailwindTheme` base.
 * 2. Performs an "inheritance" pass, where only specific component themes
 *    (like `textField`) have the `global` theme section merged into them.
 *
 * @param userTheme The partial theme provided by the user from the <Form> props.
 * @returns The final, complete, and inherited FormTheme object to be put in context.
 */

// Helper function for type-safe merging
function mergeSection<T extends object>(global: Partial<Record<string, string>>, section: T): T {
  const result = { ...section }
  for (const key in global) {
    if (key in section && typeof (section as any)[key] === 'string' && typeof global[key] === 'string') {
      ;(result as any)[key] = clsx(global[key], (section as any)[key])
    } else if (
      key in section &&
      ((section as any)[key] == null ||
        (typeof (section as any)[key] === 'string' && (section as any)[key].trim() === '')) &&
      typeof global[key] === 'string'
    ) {
      ;(result as any)[key] = global[key]
    }
  }
  return result
}

export function createFinalTheme(userTheme: Partial<FormTheme> = {}): FormTheme {
  // --- Step 1: Handle User Overrides ---
  const mergedTheme = merge({}, tailwindTheme, userTheme)

  // --- Step 2: Handle Inheritance from Global (The Smart Way) ---
  const finalTheme = { ...mergedTheme }
  const globalStyles = finalTheme.global

  if (!globalStyles) {
    return FormThemeSchema.parse(finalTheme)
  }

  // Define which keys to apply inheritance to
  const inheritableKeys: (keyof FormTheme)[] = ['textField', 'checkbox']

  for (const key of inheritableKeys) {
    const section = finalTheme[key]
    if (!section) continue

    if (key === 'textField') {
      finalTheme[key] = mergeSection(globalStyles, section as FormTheme['textField'])
    } else if (key === 'checkbox') {
      finalTheme[key] = mergeSection(globalStyles, section as FormTheme['checkbox'])
    }
    // Add more as needed for other inheritable keys
  }

  return FormThemeSchema.parse(finalTheme)
}
