import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'
import React from 'react'

export function TextField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Text }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()

  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <>
          <input
            id={field.key}
            type="text"
            className={clsx(
              theme.textField.input,
              hasError && theme.textField.error,
              theme.textField.disabled
            )}
            disabled={true}
            value={value}
          />
          {field.options.helpText && (
            <div className={clsx(theme.textField.helpText)}>{field.options.helpText}</div>
          )}
        </>
      )
    }
    // Render as plain value
    return (
      <>
        <div className={theme.textField.readOnly}>{value ? value : '—'}</div>
        {field.options.helpText && (
          <div className={clsx(theme.textField.helpText)}>{field.options.helpText}</div>
        )}
      </>
    )
  }

  return (
    <>
      <input
        id={field.key}
        type="text"
        disabled={field.options.disabled}
        autoComplete="true"
        placeholder={field.options.placeholder}
        defaultValue={field.options.defaultValue}
        required={field.options.required}
        {...form.register(field.key, { required: field.options.required })}
        className={clsx(
          theme.textField.input,
          field.options.disabled && theme.textField.disabled,
          hasError && theme.textField.error
        )}
      />
      {field.options.helpText && (
        <div className={clsx(theme.textField.helpText)}>{field.options.helpText}</div>
      )}
    </>
  )
}
