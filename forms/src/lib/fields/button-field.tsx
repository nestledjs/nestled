'use client'

import React from 'react'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { Button, ButtonProps } from './button'

export function ButtonField({
  field,
  form,
  hasError,
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Button }>>) {

  const handleClick = field?.options?.onClick || (field?.options?.type === 'submit' && field?.options?.disabled) ?
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent form submission if button is disabled
      if (field?.options?.disabled) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      
      // Call custom onClick if provided
      if (field.options.onClick) {
        await field?.options?.onClick?.()
      }
    } : undefined

  const buttonProps: ButtonProps = {
    variant: field.options.variant,
    loading: field.options.loading,
    disabled: field.options.disabled,
    type: field.options.type ?? 'button',
    fullWidth: field.options.fullWidth,
    className: field.options.className,
  }

  // Only add onClick if a custom handler exists
  if (handleClick) {
    buttonProps.onClick = handleClick
  }

  return (
    <Button {...buttonProps}>
      {field.options.text ?? field.options.label ?? 'Button'}
    </Button>
  )
}
