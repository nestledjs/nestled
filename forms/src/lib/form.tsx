import React, { useEffect, useMemo } from 'react'
import { useForm, UseFormProps } from 'react-hook-form'
import { FormField } from './form-types'
import clsx from 'clsx'
import { FormContext } from './form-context'
import { RenderFormField } from './render-form-field' // Import the new renderer
import { ThemeContext } from './theme-context'
import { FormTheme } from './form-theme'
import { FormConfigContext, FormConfig } from './form-config-context'
import { createFinalTheme } from './utils/resolve-theme'

export interface FormProps extends UseFormProps {
  id: string
  fields?: (FormField | null)[]
  children?: React.ReactNode
  submit: (values: Record<string, unknown>) => void | Promise<unknown>
  className?: string
  /**
   * If true, the entire form is in read-only mode.
   */
  readOnly?: boolean
  /**
   * Determines how the fields should appear when in read-only mode.
   * 'value': Renders the data as plain text. (Default)
   * 'disabled': Renders the UI component in a disabled state.
   */
  readOnlyStyle?: 'value' | 'disabled'
  theme?: Partial<FormTheme>
  /**
   * Controls the visibility of field labels globally across the form.
   * - 'default': Shows labels for all fields except Checkbox (default behavior).
   * - 'all': Shows labels for all fields, including Checkbox.
   * - 'none': Hides all labels.
   */
  labelDisplay?: 'all' | 'default' | 'none'
}

export function Form({
  id,
  fields,
  children,
  submit,
  defaultValues,
  className,
  readOnly = false,
  readOnlyStyle = 'value',
  theme: userTheme = {},
  labelDisplay = 'default',
}: Readonly<FormProps>) {
  const form = useForm({ defaultValues })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const finalTheme = useMemo(() => createFinalTheme(userTheme), [userTheme])
  // Create the value for our new context
  const formConfig: FormConfig = { labelDisplay }

  return (
    <FormConfigContext.Provider value={formConfig}>
      <ThemeContext.Provider value={finalTheme}>
        <FormContext.Provider value={form}>
          <form id={id} className={clsx('space-y-6', className)} onSubmit={form.handleSubmit(submit)}>
            {/* Render fields from the declarative array */}
            {fields?.map((field) =>
              field ? (
                <RenderFormField
                  key={field.key}
                  field={field}
                  formReadOnly={readOnly}
                  formReadOnlyStyle={readOnlyStyle}
                />
              ) : null,
            )}

            {/* Render any manually placed fields */}
            {children}

            {/* The default submit button has been removed. Users must add their own <Button type="submit">. */}
          </form>
        </FormContext.Provider>
      </ThemeContext.Provider>
    </FormConfigContext.Provider>
  )
}
