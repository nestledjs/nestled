'use client'

import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'
import { useFieldValidation } from '../hooks/use-field-validation'

export function PasswordField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Password }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''

  // Get validation rules including Zod schema and cross-field validation
  const validationRules = useFieldValidation(
    field,
    form
  )

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="password"
          className={clsx(
            theme.passwordField.input,
            theme.passwordField.readOnlyInput,
            hasError && theme.passwordField.error
          )}
          disabled={true}
          value={value}
        />
      )
    }
    // Render as masked value
    return (
      <div className={clsx(theme.passwordField.readOnlyValue)}>
        {'*'.repeat(value.length) || '—'}
      </div>
    )
  }

  return (
    <>
      <input
        id={field.key}
        type="password"
        placeholder={field.options.placeholder}
        className={clsx(
          theme.passwordField.input,
          field.options.disabled && theme.passwordField.disabled,
          hasError && theme.passwordField.error
        )}
        disabled={field.options.disabled}
        required={field.options.required}
        defaultValue={field.options.defaultValue}
        {...form.register(field.key, validationRules)}
      />
      {field.options.helpText && (
        <div className="text-xs text-gray-500">{field.options.helpText}</div>
      )}
    </>
  )
}
