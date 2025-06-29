import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

export function EmailField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Email }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  // Get the fully resolved theme from the context
  const theme = useFormTheme()
  const emailTheme = theme.emailField

  // Determine read-only state with field-level precedence
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="email"
          className={clsx(
            emailTheme.input,
            emailTheme.disabled,
            hasError && emailTheme.error
          )}
          disabled={true}
          value={value}
          readOnly
        />
      )
    }
    // Render as plain value
    return (
      <div className={clsx(emailTheme.readOnlyValue)}>
        {value || '—'}
      </div>
    )
  }

  return (
    <input
      id={field.key}
      type="email"
      autoComplete="email"
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      {...form.register(field.key, { required: field.options.required })}
      className={clsx(
        emailTheme.input,
        field.options.disabled && emailTheme.disabled,
        hasError && emailTheme.error
      )}
    />
  )
}
