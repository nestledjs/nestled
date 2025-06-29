import clsx from 'clsx'
import React from 'react'
import { useFormTheme } from '../theme-context'
import { Controller } from 'react-hook-form'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

export function CheckboxField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Checkbox }>> & {
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme().checkbox
  const options = field.options
  const isReadOnly = options.readOnly ?? formReadOnly
  const effectiveReadOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key)

  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!options.indeterminate
    }
  }, [options.indeterminate])

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

  if (isReadOnly) {
    return (
      <div className={clsx(theme.wrapper, options.wrapperClassNames)}>
        <div className={clsx(options.fullWidthLabel ? theme.rowFullWidth : theme.row)}>
          {effectiveReadOnlyStyle === 'disabled' ? (
            <input
              id={field.key}
              type="checkbox"
              className={clsx(theme.input, hasError && theme.error, theme.disabled)}
              disabled={true}
              checked={!!value}
              readOnly
            />
          ) : value && theme.readonlyCheckedIcon ? (
            theme.readonlyCheckedIcon
          ) : !value && theme.readonlyUncheckedIcon ? (
            theme.readonlyUncheckedIcon
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
        <input
          id={field.key}
          type="checkbox"
          ref={inputRef}
          checked={!!controllerField.value}
          onChange={e => controllerField.onChange(e.target.checked)}
          disabled={options.disabled}
          className={clsx(
            theme.input,
            theme.focus,
            options.disabled && theme.disabled,
            hasError && theme.error,
            controllerField.value && theme.checked,
            options.indeterminate && theme.indeterminate
          )}
          aria-invalid={hasError}
          aria-checked={!!controllerField.value}
          aria-disabled={options.disabled}
        />
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
