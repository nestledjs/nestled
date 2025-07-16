import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormContext } from '../src/lib/form-context'
import { FormConfigContext } from '../src/lib/form-config-context'
import { ThemeContext } from '../src/lib/theme-context'
import { RenderFormField } from '../src/lib/render-form-field'
import { FormField } from '../src/lib/form-types'
import { FormTheme } from '../src/lib/form-theme'
import { createFinalTheme } from '../src/lib/utils/resolve-theme'
import { SelectOption, SearchSelectOption } from '../src/lib/form-types'

interface StorybookFieldWrapperProps {
  showState?: boolean
  field: FormField
  userTheme?: Partial<FormTheme> // Allow passing custom theme overrides
  hasError?: boolean
  errorMessage?: string
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
  labelDisplay?: 'default' | 'all' | 'none'
}

// Type guard to check if an option is a SelectOption
const isSelectOption = (option: any): option is SelectOption => {
  return option && typeof option === 'object' && 'label' in option && 'value' in option
}

// Type guard to check if an option is a SearchSelectOption
const isSearchSelectOption = (option: any): option is SearchSelectOption => {
  return option && typeof option === 'object' && 'label' in option && 'value' in option && typeof option.value === 'string'
}

// Type guard to check if defaultValue is an array of strings
const isStringArray = (value: any): value is string[] => {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
}

export const StorybookFieldWrapper: React.FC<StorybookFieldWrapperProps> = ({
  field,
  showState = true,
  userTheme, // Receive the user theme
  hasError,
  errorMessage = 'This field has an error.',
  formReadOnly,
  formReadOnlyStyle,
  labelDisplay = 'default',
}) => {
  // Normalize defaultValue for MultiSelect and SearchSelectMulti fields with proper type safety
  let normalizedDefaultValue: any = field.options.defaultValue

  if (field.type === 'MultiSelect' || field.type === 'SearchSelectMulti') {
    const defaultValue = field.options.defaultValue
    const options = field.options.options

    // Only normalize if we have a string array and options to map against
    if (isStringArray(defaultValue) && options && Array.isArray(options)) {
      if (field.type === 'MultiSelect') {
        // For MultiSelect, map to SelectOption[]
        const mappedOptions = defaultValue
          .map((id) => options.find((opt) => String(opt.value) === id))
          .filter((opt): opt is SelectOption => isSelectOption(opt))
        
        // Only use mapped options if we found all the values
        if (mappedOptions.length === defaultValue.length) {
          normalizedDefaultValue = mappedOptions
        }
      } else if (field.type === 'SearchSelectMulti') {
        // For SearchSelectMulti, map to SearchSelectOption[]
        const mappedOptions = defaultValue
          .map((id) => options.find((opt) => opt.value === id))
          .filter((opt): opt is SearchSelectOption => isSearchSelectOption(opt))
        
        // Only use mapped options if we found all the values
        if (mappedOptions.length === defaultValue.length) {
          normalizedDefaultValue = mappedOptions
        }
      }
    }
  }

  const form = useForm({
    defaultValues: {
      [field.key]: normalizedDefaultValue,
    },
  })

  useEffect(() => {
    if (hasError) {
      form.setError(field.key, { type: 'manual', message: errorMessage })
    } else {
      form.clearErrors(field.key)
    }
  }, [hasError, field.key, errorMessage, form])

  // Pass the userTheme to the creator function
  const finalTheme = createFinalTheme(userTheme)

  return (
    <div className="max-w-md p-4 bg-white rounded-lg shadow">
      <FormConfigContext.Provider value={{ labelDisplay }}>
        <ThemeContext.Provider value={finalTheme}>
          <FormContext.Provider value={form as any}>
            <RenderFormField field={field} formReadOnly={formReadOnly} formReadOnlyStyle={formReadOnlyStyle} />

            {showState && (
              <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
                <h4 className="font-bold mb-2">Live Form State:</h4>
                <pre>{JSON.stringify(form.watch(), null, 2)}</pre>
              </div>
            )}
          </FormContext.Provider>
        </ThemeContext.Provider>
      </FormConfigContext.Provider>
    </div>
  )
}
