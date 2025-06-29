import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

export function UrlField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Url }>> & {
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
        <input
          id={field.key}
          type="url"
          className={clsx(
            theme.urlField.input,
            theme.urlField.disabled,
            hasError && theme.urlField.error
          )}
          disabled={true}
          value={value}
        />
      )
    }
    // Render as plain value
    return <div className={theme.urlField.readOnlyValue}>{value ?? '—'}</div>
  }

  return (
    <input
      id={field.key}
      type="url"
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      {...form.register(field.key, { required: field.options.required })}
      className={clsx(
        theme.urlField.input,
        field.options.disabled && theme.urlField.disabled,
        hasError && theme.urlField.error
      )}
    />
  )
}
