export * from './lib/form'
export * from './lib/form-fields'
export * from './lib/form-types'
export { tailwindTheme } from './lib/themes/tailwind'
export { FormThemeSchema } from './lib/form-theme'
export type { FormTheme } from './lib/form-theme'
export { themeReference, generateThemeTemplate, createCustomTheme } from './lib/theme-reference'
export type { FormProps } from './lib/form'
export { Field } from './lib/field'
export { RenderField } from './lib/render-field'

// Backwards compatibility (deprecated - use Field instead)
export { Field as RenderFormField } from './lib/field'
export { useFormContext } from './lib/form-context'
export { useFormConfig } from './lib/form-config-context'
export { useFormTheme } from './lib/theme-context'
export { createFinalTheme } from './lib/utils/resolve-theme'

// Export key types for library consumers
export type { FormField, FormFieldType, BaseFieldOptions } from './lib/form-types'
export type { FormConfig } from './lib/form-config-context'
