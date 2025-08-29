import React from 'react'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { Button, ButtonProps } from './button'

export function ButtonField({
  field,
  form,
  hasError,
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Button }>>) {

  const handleClick = field?.options?.onClick ?
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      await field.options.onClick?.()
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
