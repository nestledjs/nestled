import clsx from 'clsx'
import React from 'react'
import { useFormTheme } from '../theme-context'
import { Controller } from 'react-hook-form'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

export function CustomCheckboxField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.CustomCheckbox }>> & {
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme().customCheckbox
  const options = field.options
  const isReadOnly = options.readOnly ?? formReadOnly
  const effectiveReadOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key)

  const labelNode = options.label ? (
    <label
      htmlFor={field.key}
      className={clsx(theme.label, options.fullWidthLabel && theme.fullWidthLabel)}
    >
      {options.label}
      {options.required && <span style={{ color: 'red', marginLeft: 2 }}>*</span>}
    </label>
  ) : null

  const helpTextNode = options.helpText ? <div className={clsx(theme.helpText)}>{options.helpText}</div> : null

  // Determine which icons to use (options override theme defaults)
  const checkedIcon = options.checkedIcon ?? theme.checkedIcon
  const uncheckedIcon = options.uncheckedIcon ?? theme.uncheckedIcon
  const readonlyCheckedIcon = options.readonlyCheckedIcon ?? theme.readonlyCheckedIcon
  const readonlyUncheckedIcon = options.readonlyUncheckedIcon ?? theme.readonlyUncheckedIcon

  if (isReadOnly) {
    return (
      <div className={clsx(theme.wrapper, options.wrapperClassNames)}>
        <div className={clsx(options.fullWidthLabel ? theme.rowFullWidth : theme.row)}>
          {effectiveReadOnlyStyle === 'disabled' ? (
            <div className={clsx(theme.checkboxContainer)}>
              <span
                className={clsx(
                  theme.customCheckbox,
                  hasError && theme.error,
                  theme.disabled,
                  value && theme.checked
                )}
              >
                {value ? checkedIcon : uncheckedIcon}
              </span>
            </div>
          ) : value && readonlyCheckedIcon ? (
            readonlyCheckedIcon
          ) : !value && readonlyUncheckedIcon ? (
            readonlyUncheckedIcon
          ) : (
            <div className={theme.readOnly}>{value ? 'Yes' : 'No'}</div>
          )}
          {labelNode}
        </div>
        {helpTextNode}
      </div>
    )
  }

  const input = (
    <Controller
      name={field.key}
      control={form.control}
      defaultValue={options.defaultValue}
      rules={{ required: options.required }}
      render={({ field: controllerField }) => (
        <div className={clsx(theme.checkboxContainer)}>
          <input
            id={field.key}
            type="checkbox"
            checked={!!controllerField.value}
            onChange={e => controllerField.onChange(e.target.checked)}
            disabled={options.disabled}
            className={clsx(theme.hiddenInput)}
            aria-invalid={hasError}
            aria-checked={!!controllerField.value}
            aria-disabled={options.disabled}
          />
          <span
            className={clsx(
              theme.customCheckbox,
              options.disabled && theme.disabled,
              hasError && theme.error,
              controllerField.value === true && theme.checked
            )}
          >
            {controllerField.value === true ? checkedIcon : uncheckedIcon}
          </span>
        </div>
      )}
    />
  )

  if (options.customWrapper) {
    let elements
    if (options.fullWidthLabel) {
      elements = [labelNode, input]
    } else {
      elements = [input, labelNode]
    }
    return options.customWrapper(elements)
  }

  return (
    <div key={`${field.key}_wrapper`} className={clsx(theme.wrapper, options.wrapperClassNames)}>
      <div className={clsx(options.fullWidthLabel ? theme.rowFullWidth : theme.row)}>
        {input}
        {labelNode}
      </div>
      {helpTextNode}
    </div>
  )
} 