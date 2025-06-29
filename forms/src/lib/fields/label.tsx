import React from 'react'
import clsx from 'clsx'
import { useFormTheme } from '../theme-context'

interface FormLabelProps {
  htmlFor: string
  label: string
  required?: boolean
}

export function FormLabel({ htmlFor, label, required }: FormLabelProps) {
  const theme = useFormTheme()

  return (
    <label htmlFor={htmlFor} className={clsx(theme.label.base)}>
      {label}
      {required && (
        <span className={clsx(theme.label.requiredIndicator)}> *</span>
      )}
    </label>
  )
}