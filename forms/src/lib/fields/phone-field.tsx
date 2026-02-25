'use client'

import { isPossiblePhoneNumber } from 'react-phone-number-input'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'
import { useFieldValidation } from '../hooks/use-field-validation'
import { useMemo } from 'react'

/**
 * Default phone validation for US numbers.
 * Allows empty values (use `required` for mandatory fields).
 */
function validatePhone(val: string): string | boolean {
  if (val === undefined || val === null || val === '') return true
  return isPossiblePhoneNumber(val.toString(), 'US') || 'Please enter a valid phone number'
}

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

  // Build a field config that includes phone validation as the default validate
  // if no custom validate was provided by the consumer.
  // Using field.options.validate as dependency to avoid unnecessary recalculations
  // when parent re-renders with a new field object reference.
  const fieldWithPhoneValidation = useMemo(() => {
    if (field.options.validate) {
      return field
    }
    return {
      ...field,
      options: {
        ...field.options,
        validate: validatePhone,
      },
    }
  }, [field, field.options.validate])

  // Use the same validation pipeline as TextField, EmailField, etc.
  const validationRules = useFieldValidation(fieldWithPhoneValidation, form)

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
        {value === undefined || value === null || value === '' ? '—' : value}
      </div>
    )
  }

  return (
    <div>
      <input
        id={field.key}
        type="tel"
        placeholder={field.options.placeholder}
        className={clsx(
          theme.phoneField.input,
          field.options.disabled && theme.phoneField.disabled,
          hasError && theme.phoneField.error
        )}
        disabled={field.options.disabled}
        required={field.options.required}
        defaultValue={field.options.defaultValue}
        {...form.register(field.key, validationRules)}
      />
      {field.options.helpText && (
        <div className="text-xs text-gray-500">{field.options.helpText}</div>
      )}
    </div>
  )
}
