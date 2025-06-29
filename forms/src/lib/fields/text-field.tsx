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
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Input }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()

  const fieldTheme = theme.textField
  console.log(fieldTheme)

  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''

  return isReadOnly ? (
    readOnlyStyle === 'disabled' ? (
      <input
        id={field.key}
        type="text"
        className={clsx(fieldTheme.input || '', hasError && (fieldTheme.error || ''), fieldTheme.disabled || '')}
        disabled={true}
        value={value}
      />
    ) : (
      <div className={fieldTheme.readOnly || ''}>{value ?? '—'}</div>
    )
  ) : (
    <input
      id={field.key}
      type="text"
      disabled={field.options.disabled}
      autoComplete="true"
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      {...form.register(field.key, { required: field.options.required })}
      className={clsx(
        fieldTheme.input || '',
        hasError && (fieldTheme.error || ''),
        field.options.disabled && (fieldTheme.disabled || ''),
      )}
    />
  )
}
