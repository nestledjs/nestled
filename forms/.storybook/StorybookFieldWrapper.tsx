import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormContext } from '../src/lib/form-context'
import { FormConfigContext } from '../src/lib/form-config-context'
import { ThemeContext } from '../src/lib/theme-context'
import { Field } from '../src/lib/field'
import { FormField } from '../src/lib/form-types'
import { FormTheme } from '../src/lib/form-theme'
import { createFinalTheme } from '../src/lib/utils/resolve-theme'

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
  const form = useForm({
    defaultValues: {
      [field.key]: field.options.defaultValue,
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
            <Field field={field} formReadOnly={formReadOnly} formReadOnlyStyle={formReadOnlyStyle} />
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
