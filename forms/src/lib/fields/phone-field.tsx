import { isPossiblePhoneNumber } from 'react-phone-number-input'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

export function PhoneField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Phone }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()
  
  function validatePhone(val: string) {
    return val === undefined || val === '' || isPossiblePhoneNumber((val ?? '')?.toString(), 'US')
  }

  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="tel"
          className={clsx(
            theme.phoneField.input,
            theme.phoneField.readOnlyInput,
            hasError && theme.phoneField.error
          )}
          disabled={true}
          value={value}
        />
      )
    }
    // Render as plain value
    return (
      <div className={clsx(theme.phoneField.readOnlyValue)}>
        {value ?? '—'}
      </div>
    )
  }

  return (
    <div className={clsx(theme.phoneField.wrapper)}>
      <input
        id={field.key}
        type="tel"
        disabled={field.options.disabled}
        placeholder={field.options.placeholder}
        defaultValue={field.options.defaultValue}
        {...form.register(field.key, {
          validate: (v) => validatePhone(v),
        })}
        className={clsx(
          theme.phoneField.input,
          field.options.disabled && theme.phoneField.disabled,
          hasError && theme.phoneField.error
        )}
      />
      {hasError && (
        <div className={clsx(theme.phoneField.errorMessage)}>
          * Phone number is invalid
        </div>
      )}
    </div>
  )
}
