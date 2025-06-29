import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

export function TextAreaField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.TextArea }>> & {
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
        <textarea
          rows={field.options.rows ?? 4}
          id={field.key}
          className={clsx(
            theme.textAreaField.textarea,
            theme.textAreaField.disabled,
            hasError && theme.textAreaField.error
          )}
          disabled={true}
          value={value}
        />
      )
    }
    // Render as plain value
    return <div className={theme.textAreaField.readOnlyValue}>{value ?? '—'}</div>
  }

  return (
    <textarea
      rows={field.options.rows ?? 4}
      id={field.key}
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      className={clsx(
        theme.textAreaField.textarea,
        field.options.disabled && theme.textAreaField.disabled,
        hasError && theme.textAreaField.error
      )}
      {...form.register(field.key, { required: field.options.required })}
    />
  )
}
