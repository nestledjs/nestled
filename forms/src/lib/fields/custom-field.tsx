import clsx from 'clsx'
import React from 'react'
import { useFormTheme } from '../theme-context'
import { FormField, FormFieldProps, FormFieldType, CustomFieldRenderProps } from '../form-types'

export function CustomField<T = unknown>({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Custom }>> & {
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme().customField
  const options = field.options
  const isReadOnly = options.readOnly ?? formReadOnly
  const effectiveReadOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? options.defaultValue

  if (isReadOnly) {
    let displayValue: string
    if (value === undefined || value === null || value === '') {
      displayValue = '—'
    } else if (typeof value === 'string') {
      displayValue = value
    } else {
      try {
        displayValue = JSON.stringify(value)
      } catch {
        displayValue = String(value)
      }
    }
    
    if (effectiveReadOnlyStyle === 'disabled') {
      // Render as disabled input (fallback to string value)
      return (
        <div className={clsx(theme.wrapper)}>
          <input
            type="text"
            disabled={true}
            value={displayValue}
            className={clsx(theme.readOnlyInput)}
            readOnly
          />
        </div>
      )
    }
    
    // Render as plain value
    return (
      <div className={clsx(theme.wrapper)}>
        <div className={clsx(theme.readOnlyValue)}>{displayValue}</div>
      </div>
    )
  }

  // Create render props for the custom field
  const renderProps: CustomFieldRenderProps<T> = {
    value: value as T,
    onChange: (newValue: T) => {
      form.setValue(field.key, newValue)
      // Trigger validation if the field has validation rules
      form.trigger(field.key)
    },
    field: field,
  }

  try {
    // Render the custom field component with the render props
    const customFieldContent = options.customField(renderProps)
    
    if (options.customWrapper) {
      return options.customWrapper(customFieldContent)
    }
    
    return (
      <div className={clsx(theme.wrapper)}>
        {customFieldContent}
      </div>
    )
  } catch (error) {
    console.error('Error rendering custom field:', error)
    return (
      <div className={clsx(theme.wrapper)}>
        <div className={clsx(theme.errorContainer)}>
          <div className={clsx(theme.errorText)}>
            Error rendering custom field: {field.key}
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className={clsx(theme.errorText, 'mt-1 text-xs')}>
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}
        </div>
      </div>
    )
  }
}

CustomField.displayName = 'CustomField'
