import { ReactElement, JSXElementConstructor } from 'react'
import { Controller } from 'react-hook-form'
import clsx from 'clsx'
import { ClientOnly } from '../utils/client-only'
import { useFormTheme } from '../theme-context'

export interface BaseSelectFieldProps {
  // Form integration
  form: any
  field: any
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
  
  // Theme
  themeKey: string // Key in theme object
  
  // Rendering
  children: (props: {
    fieldValue: any
    onChange: (value: any) => void
    onBlur: () => void
    isDisabled: boolean
    isRequired: boolean
    fieldId: string
    theme: any
  }) => ReactElement<unknown, string | JSXElementConstructor<any>>
  
  // Read-only value rendering
  renderReadOnlyValue?: (value: any, theme: any) => string
}

export function BaseSelectField({
  form,
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
  themeKey,
  children,
  renderReadOnlyValue,
}: BaseSelectFieldProps) {
  const theme = useFormTheme()
  const fieldTheme = theme[themeKey as keyof typeof theme] as any
  
  // Determine read-only state with field-level precedence
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key)
  
  // Handle read-only rendering
  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          type="text"
          className={clsx(
            fieldTheme.readOnlyInput,
            hasError && fieldTheme.error
          )}
          disabled={true}
          value={renderReadOnlyValue ? renderReadOnlyValue(value, fieldTheme) : (value || '')}
          readOnly
        />
      )
    }
    
    // Render as plain value
    return (
      <div className={fieldTheme.readOnlyValue}>
        {renderReadOnlyValue ? renderReadOnlyValue(value, fieldTheme) : (value || '—')}
      </div>
    )
  }

  // Render interactive field
  return (
    <ClientOnly fallback={<div className="h-10 w-full rounded-md border border-gray-300 bg-gray-100" />}>
      <Controller
        control={form.control}
        name={field.key}
        defaultValue={field.options.defaultValue}
        rules={{ required: field.options.required }}
        render={({ field: { onChange, value: fieldValue, onBlur } }) =>
          children({
            fieldValue,
            onChange,
            onBlur,
            isDisabled: field.options.disabled || false,
            isRequired: field.options.required || false,
            fieldId: field.key,
            theme: fieldTheme,
          })
        }
      />
    </ClientOnly>
  )
} 