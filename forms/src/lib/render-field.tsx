import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from './form-types'
import { FormContext } from './form-context'
import { ThemeContext } from './theme-context'
import { FormConfigContext } from './form-config-context'
import { FormTheme } from './form-theme'
import { createFinalTheme } from './utils/resolve-theme'
import { Field } from './field'

export interface RenderFieldProps {
  /**
   * The field configuration object
   */
  field: FormField
  /**
   * Current value of the field
   */
  value?: any
  /**
   * Change handler called when field value changes
   */
  onChange?: (value: any) => void
  /**
   * Whether the field is disabled
   */
  disabled?: boolean
  /**
   * Whether the field is in read-only mode
   */
  readOnly?: boolean
  /**
   * How read-only fields should be displayed ('value' | 'disabled')
   */
  readOnlyStyle?: 'value' | 'disabled'
  /**
   * Custom theme to apply to the field
   */
  theme?: Partial<FormTheme>
  /**
   * Controls label visibility for this field
   */
  labelDisplay?: 'all' | 'default' | 'none'
  /**
   * Additional CSS classes to apply
   */
  className?: string
}

/**
 * Standalone field renderer that can be used outside of forms.
 *
 * This component provides the same styling and functionality as fields within forms
 * but can be used independently for things like filters, settings, or other UI elements.
 *
 * @example
 * ```tsx
 * // Simple standalone select
 * <RenderField
 *   field={FormFieldClass.select('filter', {
 *     label: 'Filter by Type',
 *     options: [
 *       { value: 'all', label: 'All Items' },
 *       { value: 'active', label: 'Active' },
 *       { value: 'inactive', label: 'Inactive' }
 *     ]
 *   })}
 *   value={selectedFilter}
 *   onChange={setSelectedFilter}
 * />
 *
 * // Standalone text field with custom styling
 * <RenderField
 *   field={FormFieldClass.text('search', {
 *     label: 'Search',
 *     placeholder: 'Enter search term...'
 *   })}
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   theme={{
 *     textField: {
 *       input: 'border-2 border-blue-300 rounded-lg'
 *     }
 *   }}
 * />
 * ```
 */
export function RenderField({
  field,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  readOnlyStyle = 'value',
  theme: userTheme = {},
  labelDisplay = 'default',
  className,
}: Readonly<RenderFieldProps>) {
  // Create a minimal form instance for compatibility
  const form = useForm({
    defaultValues: {
      [field.key]: value,
    },
  })

  // Keep the form in sync with the external value
  useEffect(() => {
    form.setValue(field.key, value)
  }, [value, field.key, form])

  // Watch for changes and call onChange
  useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      if (name === field.key && onChange) {
        onChange(data[field.key])
      }
    })
    return () => subscription.unsubscribe()
  }, [form, field.key, onChange])

  const finalTheme = useMemo(() => createFinalTheme(userTheme), [userTheme])
  const formConfig = useMemo(() => ({ labelDisplay }), [labelDisplay])

  return (
    <div className={className}>
      <FormConfigContext.Provider value={formConfig}>
        <ThemeContext.Provider value={finalTheme}>
          <FormContext.Provider value={form}>
            <Field
              field={field}
              formReadOnly={readOnly || disabled}
              formReadOnlyStyle={disabled ? 'disabled' : readOnlyStyle}
            />
          </FormContext.Provider>
        </ThemeContext.Provider>
      </FormConfigContext.Provider>
    </div>
  )
}
