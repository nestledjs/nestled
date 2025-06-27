import React, { useEffect } from 'react'
import { useForm, UseFormProps } from 'react-hook-form'
import { FormField } from './form-types'
import clsx from 'clsx'
import { FormContext } from './form-context'
import { RenderFormField } from './render-form-field' // Import the new renderer

export interface FormProps extends UseFormProps {
  fields?: (FormField | null)[] // For declarative rendering
  children?: React.ReactNode // For imperative rendering
  submit: (values: Record<string, unknown>) => void | Promise<unknown>
  buttonText?: string
  loading?: boolean
  className?: string
  /**
   * If true, the entire form is in read-only mode.
   */
  readOnly?: boolean;
  /**
   * Determines how the fields should appear when in read-only mode.
   * 'value': Renders the data as plain text. (Default)
   * 'disabled': Renders the UI component in a disabled state.
   */
  readOnlyStyle?: 'value' | 'disabled';
}

export function Form({
  fields,
  children,
  submit,
  buttonText = 'Submit',
  defaultValues,
  loading = false,
  className,
  readOnly = false,
  readOnlyStyle = 'value',
}: Readonly<FormProps>) {
  const form = useForm({ defaultValues })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  return (
    // Provide the form context to all children
    <FormContext.Provider value={form}>
      <form className={clsx('space-y-6', className)} onSubmit={form.handleSubmit(submit)}>
        {/* Render fields from the declarative array */}
        {fields?.map((field) =>
          field ? <RenderFormField key={field.key} field={field} formReadOnly={readOnly} formReadOnlyStyle={readOnlyStyle} /> : null
        )}

        {/* Render any manually placed fields */}
        {children}

        {/* Hide submit button in read-only mode */}
        {!readOnly && (
          <div className="mt-6">
            <button type="submit" disabled={loading} className={clsx(/* ... */)}>
              {loading ? 'Processing...' : buttonText}
            </button>
          </div>
        )}
      </form>
    </FormContext.Provider>
  )
}
