import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

export function NumberField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Number }>> & {
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
          type="number"
          className={clsx(
            theme.numberField.input,
            theme.numberField.readOnlyInput,
            hasError && theme.numberField.error
          )}
          disabled={true}
          value={value}
          min={field.options.min}
          max={field.options.max}
          step={field.options.step}
        />
      )
    }
    // Render as plain value
    return (
      <div className={clsx(theme.numberField.readOnlyValue)}>
        {value ?? '—'}
      </div>
    )
  }

  return (
    <input
      id={field.key}
      type="number"
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      min={field.options.min}
      max={field.options.max}
      step={field.options.step}
      {...form.register(field.key, { required: field.options.required, valueAsNumber: true })}
      className={clsx(
        theme.numberField.input,
        field.options.disabled && theme.numberField.disabled,
        hasError && theme.numberField.error
      )}
    />
  )
}
