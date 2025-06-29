import React from 'react'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { Button } from './button'

export function ButtonField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Button }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  
  // In read-only mode, buttons are typically hidden or disabled
  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <Button
          variant={field.options.variant}
          disabled={true}
          type={field.options.type ?? 'button'}
        >
          {field.options.text ?? field.options.label ?? 'Button'}
        </Button>
      )
    }
    // For 'value' style, we could return null (hidden) or a text representation
    return <div className="text-gray-500 italic">Button: {field.options.text ?? field.options.label ?? 'Button'}</div>
  }

  const handleClick = async () => {
    if (field.options.onClick) {
      await field.options.onClick()
    }
  }

  return (
    <Button
      variant={field.options.variant}
      loading={field.options.loading}
      disabled={field.options.disabled}
      type={field.options.type ?? 'button'}
      onClick={handleClick}
    >
      {field.options.text ?? field.options.label ?? 'Button'}
    </Button>
  )
} 