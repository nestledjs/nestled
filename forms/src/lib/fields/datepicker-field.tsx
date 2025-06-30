import clsx from 'clsx'
import React from 'react'
import { Controller } from 'react-hook-form'
import { useFormTheme } from '../theme-context'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { formatDateFromDateTime, getDateFromDateTime } from '../utils/date-time'
import { FormLabel } from './label'

export function DatePickerField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
  errorMessage,
}: FormFieldProps<Extract<FormField, { type: FormFieldType.DatePicker }>> & {
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
  errorMessage?: string
}) {
  const theme = useFormTheme().datePicker
  const options = field.options
  const isReadOnly = options.readOnly ?? formReadOnly
  const effectiveReadOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''
  const helpText = (options as any).helpText
  const helpTextClass = useFormTheme().checkbox.helpText
  const describedByIds = []
  if (helpText) describedByIds.push(`${field.key}-help`)
  if (hasError && errorMessage) describedByIds.push(`${field.key}-error`)

  if (isReadOnly) {
    if (effectiveReadOnlyStyle === 'disabled') {
      return (
        <div className={clsx(theme.wrapper)}>
          <FormLabel htmlFor={field.key} label={options.label || ''} required={options.required} />
          <input
            id={field.key}
            type="date"
            disabled={true}
            value={value}
            className={clsx(theme.readOnlyInput, hasError && theme.error)}
            readOnly
            required={options.required}
            aria-describedby={describedByIds.length ? describedByIds.join(' ') : undefined}
          />
          {helpText && <div id={`${field.key}-help`} className={helpTextClass}>{helpText}</div>}
          {hasError && errorMessage && <div id={`${field.key}-error`} className={theme.error}>{errorMessage}</div>}
        </div>
      )
    }
    
    // Render as plain value (formatted)
    const formattedDate = formatDateFromDateTime(value) || '—'
    return (
      <div className={clsx(theme.wrapper)}>
        <FormLabel htmlFor={field.key} label={options.label || ''} required={options.required} />
        <div className={clsx(theme.readOnlyValue)}>{formattedDate}</div>
        {helpText && <div id={`${field.key}-help`} className={helpTextClass}>{helpText}</div>}
        {hasError && errorMessage && <div id={`${field.key}-error`} className={theme.error}>{errorMessage}</div>}
      </div>
    )
  }

  const inputProps = {
    id: field.key,
    type: 'date' as const,
    disabled: options.disabled,
    placeholder: options.placeholder,
    min: options.min,
    max: options.max || '9999-12-31',
    className: clsx(
      theme.input,
      options.disabled && theme.disabled,
      hasError && theme.error
    ),
    required: options.required,
    'aria-describedby': describedByIds.length ? describedByIds.join(' ') : undefined,
  }

  const input = options.useController ? (
    <Controller
      name={field.key}
      control={form.control}
      defaultValue={getDateFromDateTime(options.defaultValue ?? '')}
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
      defaultValue={getDateFromDateTime(options.defaultValue ?? '') ?? ''}
      {...form.register(field.key, {
        required: options.required,
        setValueAs: (v) => (v ? v.split('T')[0] : ''),
      })}
    />
  )

  if (options.customWrapper) {
    return options.customWrapper(
      <>
        <FormLabel htmlFor={field.key} label={options.label || ''} required={options.required} />
        {input}
        {helpText && <div id={`${field.key}-help`} className={helpTextClass}>{helpText}</div>}
        {hasError && errorMessage && <div id={`${field.key}-error`} className={theme.error}>{errorMessage}</div>}
      </>
    )
  }

  return (
    <div className={clsx(theme.wrapper)}>
      <FormLabel htmlFor={field.key} label={options.label || ''} required={options.required} />
      {input}
      {helpText && <div id={`${field.key}-help`} className={helpTextClass}>{helpText}</div>}
      {hasError && errorMessage && <div id={`${field.key}-error`} className={theme.error}>{errorMessage}</div>}
    </div>
  )
}
