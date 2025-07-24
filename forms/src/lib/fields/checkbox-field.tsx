import clsx from 'clsx'
import React from 'react'
import { useFormTheme } from '../theme-context'
import { Controller } from 'react-hook-form'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

type CheckboxFieldType = Extract<FormField, { type: FormFieldType.Checkbox }>

interface CheckboxFieldProps extends Omit<FormFieldProps<CheckboxFieldType>, 'hasError'> {
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}

function useIndeterminateEffect(inputRef: React.RefObject<HTMLInputElement | null>, indeterminate: boolean) {
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeterminate])
}

function renderLabel(field: CheckboxFieldType, options: any, theme: any) {
  if (!options.label) return null

  return (
    <label
      htmlFor={field.key}
      className={clsx(theme.label, options.fullWidthLabel && theme.fullWidthLabel)}
    >
      {options.label}
      {options.required && <span style={{ color: 'red', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function renderHelpText(options: any, theme: any) {
  if (!options.helpText) return null

  return <div className={clsx(theme.helpText)}>{options.helpText}</div>
}

function renderReadOnlyInput(field: CheckboxFieldType, options: any, theme: any, value: any, effectiveReadOnlyStyle = 'value') {
  if (effectiveReadOnlyStyle === 'disabled') {
    return (
      <input
        id={field.key}
        type="checkbox"
        className={clsx(theme.input, theme.disabled)}
        disabled={true}
        checked={!!value}
        readOnly
        required={options.required}
      />
    )
  }

  // For 'value' style, always render visible text 'Yes' or 'No' (no icon)
  if (effectiveReadOnlyStyle === 'value') {
    return <div className={theme.readOnly}>{value ? 'Yes' : 'No'}</div>
  }

  // fallback: if you ever add more styles, handle them here
  return <div className={theme.readOnly}>{value ? 'Yes' : 'No'}</div>
}

function renderReadOnlyState(props: CheckboxFieldProps, theme: any, value: any) {
  const { field, formReadOnlyStyle } = props
  const options = field.options
  const effectiveReadOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle ?? 'value'
  const labelNode = renderLabel(field, options, theme)
  const helpTextNode = renderHelpText(options, theme)
  const inputNode = renderReadOnlyInput(field, options, theme, value, effectiveReadOnlyStyle)

  return (
    <div className={clsx(theme.wrapper, options.wrapperClassNames)}>
      <div className={clsx(options.fullWidthLabel ? theme.rowFullWidth : theme.row)}>
        {inputNode}
        {labelNode}
      </div>
      {helpTextNode}
    </div>
  )
}

function renderControlledInput(props: CheckboxFieldProps, theme: any, inputRef: React.RefObject<HTMLInputElement | null>) {
  const { field, form, hasError } = props
  const options = field.options

  return (
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
          required={options.required}
          className={clsx(
            theme.input,
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
}

function renderStandardLayout(props: CheckboxFieldProps, inputNode: React.ReactNode, theme: any) {
  const { field } = props
  const options = field.options
  const labelNode = renderLabel(field, options, theme)
  const helpTextNode = renderHelpText(options, theme)

  return (
    <div key={`${field.key}_wrapper`} className={clsx(theme.wrapper, options.wrapperClassNames)}>
      <div className={clsx(options.fullWidthLabel ? theme.rowFullWidth : theme.row)}>
        {inputNode}
        {labelNode}
      </div>
      {helpTextNode}
    </div>
  )
}

export function CheckboxField(props: CheckboxFieldProps) {
  const { field, form, formReadOnly = false } = props
  const options = field.options
  const theme = useFormTheme().checkbox
  const isReadOnly = options.readOnly ?? formReadOnly
  const value = form.getValues(field.key)
  const inputRef = React.useRef<HTMLInputElement>(null)

  useIndeterminateEffect(inputRef, options.indeterminate ?? false)

  if (isReadOnly) {
    return renderReadOnlyState(props, theme, value)
  }

  const inputNode = renderControlledInput(props, theme, inputRef)

  return renderStandardLayout(props, inputNode, theme)
}
