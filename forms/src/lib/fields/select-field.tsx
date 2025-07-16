import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType, SelectOption } from '../form-types'
import { BaseSelectField } from './base-select-field'

export function SelectField({ 
  form, 
  field, 
  hasError, 
  formReadOnly = false, 
  formReadOnlyStyle = 'value' 
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Select }>> & { 
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled' 
}) {
  const options: SelectOption[] = field.options.options || []
  
  // Function to render read-only value
  const renderReadOnlyValue = (value: any) => {
    const selectedOption = options.find((o) => o.value === value)
    return selectedOption?.label || '—'
  }

  return (
    <BaseSelectField
      form={form}
      field={field}
      hasError={hasError}
      formReadOnly={formReadOnly}
      formReadOnlyStyle={formReadOnlyStyle}
      themeKey="selectField"
      renderReadOnlyValue={renderReadOnlyValue}
    >
      {({ fieldValue, onChange, onBlur, isDisabled, isRequired, fieldId, theme }) => (
        <div className={theme.wrapper}>
          <div className={theme.container}>
            <select
              id={fieldId}
              name={fieldId}
              value={fieldValue || ''}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={isDisabled}
              required={isRequired}
              aria-invalid={hasError}
              aria-describedby={field.options.helpText ? `${fieldId}-help` : undefined}
              role="combobox"
              className={clsx(
                theme.input,
                hasError && theme.error,
                isDisabled && theme.disabled,
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
                  className={theme.option}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <div className={theme.arrow}>
              <svg className={theme.arrowIcon} viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          {field.options.helpText && (
            <div id={`${fieldId}-help`} className={theme.helpText}>{field.options.helpText}</div>
          )}
        </div>
      )}
    </BaseSelectField>
  )
}
