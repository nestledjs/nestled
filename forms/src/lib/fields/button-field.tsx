import React from 'react'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { Button } from './button'

export function ButtonField({
  field,
  form,
  hasError,
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Button }>>) {

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
      fullWidth={field.options.fullWidth}
      className={field.options.className}
      onClick={handleClick}
    >
      {field.options.text ?? field.options.label ?? 'Button'}
    </Button>
  )
} 