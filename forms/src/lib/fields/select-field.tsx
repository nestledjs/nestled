import { Select } from '@headlessui/react'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType, SelectOption } from '../form-types'
import { ClientOnly } from '../utils/client-only'
import { Controller } from 'react-hook-form'
import { useFormTheme } from '../theme-context'

export function SelectField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Select }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const theme = useFormTheme()
  
  // Get options from field configuration
  const options: SelectOption[] = field.options.options || []
  const defaultValue = field.options.defaultValue ?? ''
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);
  const selectedOption = options.find((o) => o.value === value) || null;

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          type="text"
          className={clsx(
            theme.selectField.readOnlyInput,
            hasError && theme.selectField.error
          )}
          disabled={true}
          value={selectedOption?.label ?? ''}
          readOnly
        />
      );
    }
    // Render as plain value
    return (
      <div className={theme.selectField.readOnlyValue}>{selectedOption?.label ?? '—'}</div>
    );
  }

  return (
    <ClientOnly fallback={<div className="h-10 w-full rounded-md border border-gray-300 bg-gray-100" />}> 
      <Controller
        name={field.key}
        control={form.control}
        defaultValue={defaultValue}
        render={({ field: { onChange, value } }) => (
          <div className={theme.selectField.wrapper}>
            <div className={theme.selectField.container}>
              <Select
                id={field.key}
                name={field.key}
                value={value || ''}
                onChange={onChange}
                disabled={field.options.disabled}
                required={field.options.required}
                invalid={hasError}
                className={clsx(
                  theme.selectField.input,
                  hasError && theme.selectField.error,
                  field.options.disabled && theme.selectField.disabled,
                )}
              >
                {/* Empty option for placeholder */}
                <option value="" disabled hidden>
                  {field.options.placeholder || 'Select an option...'}
                </option>
                {options.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    className={theme.selectField.option}
                  >
                    {option.label}
                  </option>
                ))}
              </Select>
              <div className={theme.selectField.arrow}>
                <svg className={theme.selectField.arrowIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            {field.options.helpText && (
              <div className={theme.selectField.helpText}>{field.options.helpText}</div>
            )}
          </div>
        )}
      />
    </ClientOnly>
  )
}
