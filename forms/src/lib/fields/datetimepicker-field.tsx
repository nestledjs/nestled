import clsx from 'clsx'
import React from 'react'
import { Controller } from 'react-hook-form'
import { useFormTheme } from '../theme-context'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { formatDateTimeFromValue, getDateTimeFromValue } from '../utils/date-time'

export function DateTimePickerField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.DateTimePicker }>> & {
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme().dateTimePicker
  const options = field.options
  const isReadOnly = options.readOnly ?? formReadOnly
  const effectiveReadOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''

  if (isReadOnly) {
    if (effectiveReadOnlyStyle === 'disabled') {
      return (
        <div className={clsx(theme.wrapper)}>
          <input
            id={field.key}
            type="datetime-local"
            disabled={true}
            value={value}
            className={clsx(theme.readOnlyInput, hasError && theme.error)}
            readOnly
          />
        </div>
      )
    }
    
    // Render as plain value (formatted)
    const formattedDateTime = formatDateTimeFromValue(value) ?? '—'
    return (
      <div className={clsx(theme.wrapper)}>
        <div className={clsx(theme.readOnlyValue)}>{formattedDateTime}</div>
      </div>
    )
  }

  const inputProps = {
    id: field.key,
    type: 'datetime-local' as const,
    disabled: options.disabled,
    placeholder: options.placeholder,
    min: options.min,
    max: options.max,
    step: options.step,
    className: clsx(
      theme.input,
      options.disabled && theme.disabled,
      hasError && theme.error
    ),
  }

  const input = options.useController ? (
    <Controller
      name={field.key}
      control={form.control}
      defaultValue={getDateTimeFromValue(options.defaultValue ?? '')}
      rules={{ required: options.required }}
      render={({ field: controllerField }) => (
        <input
          {...inputProps}
          value={controllerField.value || ''}
          onChange={(e) => controllerField.onChange(e.target.value)}
          onBlur={controllerField.onBlur}
          ref={controllerField.ref}
        />
      )}
    />
  ) : (
    <input
      {...inputProps}
      defaultValue={getDateTimeFromValue(options.defaultValue ?? '') ?? ''}
      {...form.register(field.key, {
        required: options.required,
        setValueAs: (v) => (v ? v : ''),
      })}
    />
  )

  if (options.customWrapper) {
    return options.customWrapper(input)
  }

  return (
    <div className={clsx(theme.wrapper)}>
      {input}
    </div>
  )
}
