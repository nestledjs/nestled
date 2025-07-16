import React, { useEffect, useMemo } from 'react'
import { useForm, UseFormProps, FieldValues } from 'react-hook-form'
import { FormField } from './form-types'
import clsx from 'clsx'
import { FormContext } from './form-context'
import { RenderFormField } from './render-form-field' // Import the new renderer
import { ThemeContext } from './theme-context'
import { FormTheme } from './form-theme'
import { FormConfigContext, FormConfig } from './form-config-context'
import { createFinalTheme } from './utils/resolve-theme'

export interface FormProps<T extends FieldValues = Record<string, unknown>> extends UseFormProps<T> {
  id: string
  fields?: (FormField | null)[]
  children?: React.ReactNode
  submit: (values: T) => void | Promise<unknown>
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

/**
 * Main form component that provides both declarative and imperative form usage patterns.
 * 
 * Supports declarative usage via the `fields` prop and imperative usage via children.
 * Provides form context for field components and handles form submission.
 * 
 * @template T - The type of the form values object
 * @param id - Unique identifier for the form element
 * @param fields - Array of field definitions for declarative usage (optional)
 * @param children - React children for imperative usage (optional)
 * @param submit - Function called when form is submitted with validated values
 * @param defaultValues - Initial values for form fields
 * @param className - CSS classes to apply to the form element
 * @param readOnly - Whether the entire form should be in read-only mode
 * @param readOnlyStyle - How read-only fields should be displayed ('value' | 'disabled')
 * @param theme - Partial theme object to customize form appearance
 * @param labelDisplay - Global label visibility setting ('all' | 'default' | 'none')
 * @returns A form element with context providers for field components
 * 
 * @example
 * ```tsx
 * // Declarative usage
 * <Form
 *   id="user-form"
 *   fields={[
 *     FormFieldClass.text('username', { label: 'Username', required: true }),
 *     FormFieldClass.email('email', { label: 'Email', required: true }),
 *   ]}
 *   submit={(values) => console.log(values)}
 * />
 * 
 * // Imperative usage
 * <Form id="custom-form" submit={(values) => handleSubmit(values)}>
 *   <RenderFormField field={FormFieldClass.text('name', { label: 'Name' })} />
 *   <button type="submit">Submit</button>
 * </Form>
 * 
 * // Mixed usage
 * <Form
 *   id="mixed-form"
 *   fields={[FormFieldClass.text('username', { label: 'Username' })]}
 *   submit={(values) => handleSubmit(values)}
 * >
 *   <RenderFormField field={FormFieldClass.password('password', { label: 'Password' })} />
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 */
export function Form<T extends FieldValues = Record<string, unknown>>({
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
}: Readonly<FormProps<T>>) {
  const form = useForm<T>({ defaultValues })

  useEffect(() => {
    if (defaultValues && typeof defaultValues !== 'function') {
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  const finalTheme = useMemo(() => createFinalTheme(userTheme), [userTheme])
  // Create the value for our new context
  const formConfig: FormConfig = { labelDisplay }

  // Create a wrapper function that applies field transformations before submission
  const handleSubmitWithTransform = useMemo(() => {
    return (values: T) => {
      if (!fields) {
        // No fields to transform, call submit directly
        return submit(values)
      }

      // Apply submitTransform functions to each field that has one
      const transformedValues = { ...values } as any
      
      fields
        .filter((field): field is FormField => field !== null)
        .forEach((field) => {
          if (field.options.submitTransform && field.key in transformedValues) {
            transformedValues[field.key] = field.options.submitTransform(transformedValues[field.key])
          }
        })

      return submit(transformedValues as T)
    }
  }, [fields, submit])

  return (
    <FormConfigContext.Provider value={formConfig}>
      <ThemeContext.Provider value={finalTheme}>
        <FormContext.Provider value={form as unknown as import('react-hook-form').UseFormReturn<import('react-hook-form').FieldValues>}>
          <form id={id} className={clsx('space-y-6', className)} onSubmit={form.handleSubmit(handleSubmitWithTransform)}>
            {/* Render fields from the declarative array */}
            {fields
              ?.filter((field): field is FormField => field !== null)
              .map((field) => (
                <RenderFormField
                  key={field.key}
                  field={field}
                  formReadOnly={readOnly}
                  formReadOnlyStyle={readOnlyStyle}
                />
              ))}

            {/* Render any manually placed fields */}
            {children}

            {/* The default submit button has been removed. Users must add their own <Button type="submit">. */}
          </form>
        </FormContext.Provider>
      </ThemeContext.Provider>
    </FormConfigContext.Provider>
  )
}
