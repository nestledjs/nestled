import React from 'react'
import { FormField, FormFieldProps, FormFieldType, CustomFieldRenderProps } from '../form-types'

export function CustomField<T = unknown>({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Custom }>> & { hasError?: boolean, formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? field.options.defaultValue;

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      // Render as disabled input (fallback to string value)
      return (
        <input
          type="text"
          disabled={true}
          value={typeof value === 'string' ? value : JSON.stringify(value)}
          className="min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded"
        />
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{typeof value === 'string' ? value : JSON.stringify(value) || '—'}</div>
    );
  }

  // Create render props for the custom field
  const renderProps: CustomFieldRenderProps<T> = {
    value: value as T,
    onChange: (value: T) => {
      form.setValue(field.key, value)
    },
    field: field,
  }

  try {
    // Render the custom field component with the render props
    return field.options.customField(renderProps)
  } catch (error) {
    console.error('Error rendering custom field:', error)
    return <div className="text-red-600">Error rendering custom field: {field.key}</div>
  }
}

CustomField.displayName = 'CustomField'
