import React from 'react'
import { Controller } from 'react-hook-form'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType, CheckboxGroupOption, CheckboxGroupOptions } from '../form-types'
import { useFormTheme } from '../theme-context'

// Utility functions for value conversion (moved outside component for performance)
const stringToArray = (value: string | null | undefined, separator: string): string[] => {
  if (!value || value.trim() === '') return []
  return value.split(separator).map(v => v.trim()).filter(v => v !== '')
}

const arrayToString = (values: string[], separator: string): string => {
  return values.join(separator)
}

export function CheckboxGroupField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.CheckboxGroup }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()
  const checkboxTheme = theme.checkbox
  const groupTheme = theme.checkboxGroup
  const options: CheckboxGroupOptions = field.options

  // Determine read-only state with field-level precedence
  const isReadOnly = options.readOnly ?? formReadOnly
  const readOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle

  // Get separator for value parsing (default: comma)
  const separator = options.valueSeparator ?? ','

  // Extract checkbox change handler to reduce nesting
  const createCheckboxChangeHandler = (onChange: (value: string) => void, selectedValues: string[]) => {
    return (optionValue: string | number, isChecked: boolean) => {
      const valueStr = String(optionValue)
      let newSelectedValues: string[]
      
      if (isChecked) {
        // Add to selection if not already there
        newSelectedValues = selectedValues.includes(valueStr) 
          ? selectedValues 
          : [...selectedValues, valueStr]
      } else {
        // Remove from selection
        newSelectedValues = selectedValues.filter(v => v !== valueStr)
      }
      
      onChange(arrayToString(newSelectedValues, separator))
    }
  }

  // Extract option rendering to reduce nesting
  const renderOption = (option: CheckboxGroupOption, isChecked: boolean, isDisabled: boolean, handleChange: (optionValue: string | number, checked: boolean) => void) => {
    if (option.hidden) return null

    return (
      <div 
        key={option.key} 
        className={clsx(
          groupTheme.optionContainer,
          options.fullWidthLabel && groupTheme.optionContainerFullWidth,
          options.fancyStyle && groupTheme.optionContainerFancy
        )}
      >
        <div className={clsx(groupTheme.checkboxContainer)}>
          <input
            type="checkbox"
            id={`${field.key}_${option.key}`}
            checked={isChecked}
            onChange={(e) => handleChange(option.value, e.target.checked)}
            disabled={isDisabled}
            className={clsx(
              checkboxTheme.input,
              checkboxTheme.focus,
              isChecked && checkboxTheme.checked,
              isDisabled && checkboxTheme.disabled,
              hasError && checkboxTheme.error
            )}
          />
          <label 
            htmlFor={`${field.key}_${option.key}`}
            className={clsx(
              groupTheme.label,
              options.fullWidthLabel && groupTheme.labelFullWidth,
              options.checkboxDirection !== 'row' 
                ? groupTheme.labelColumn 
                : groupTheme.labelRow
            )}
          >
            {option.label}
          </label>
        </div>
      </div>
    )
  }

  // Extract read-only option rendering
  const renderReadOnlyOption = (option: CheckboxGroupOption, isChecked: boolean) => (
    <div key={option.key} className={clsx(groupTheme.optionContainer)}>
      <div className={clsx(groupTheme.checkboxContainer)}>
        <input
          type="checkbox"
          checked={isChecked}
          disabled={true}
          className={clsx(
            checkboxTheme.input,
            checkboxTheme.disabled,
            isChecked && checkboxTheme.checked
          )}
          readOnly
        />
        <label className={clsx(groupTheme.label)}>
          {option.label}
        </label>
      </div>
    </div>
  )

  // Handle read-only rendering
  function renderReadOnly() {
    const value = form.getValues(field.key)
    const selectedValues = stringToArray(value, separator)
    const selectedOptions = options.checkboxOptions.filter(opt => 
      selectedValues.includes(String(opt.value))
    )

    if (readOnlyStyle === 'disabled') {
      return (
        <div className={clsx(groupTheme.wrapper)}>
          <div className={clsx(
            groupTheme.container,
            options.checkboxDirection !== 'row' 
              ? groupTheme.containerColumn 
              : groupTheme.containerRow
          )}>
            {options.checkboxOptions.map((option: CheckboxGroupOption) => {
              const isChecked = selectedValues.includes(String(option.value))
              return renderReadOnlyOption(option, isChecked)
            })}
          </div>
        </div>
      )
    }

    // Render as plain values
    return (
      <div className={clsx(groupTheme.readOnlyValue)}>
        {selectedOptions.length > 0 ? (
          <div className={clsx(groupTheme.readOnlyContainer)}>
            {selectedOptions.map((option, index) => (
              <div key={option.key} className={clsx(groupTheme.readOnlySelected)}>
                <span>✓ {option.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={clsx(groupTheme.readOnlyUnselected)}>
            No options selected
          </div>
        )}
      </div>
    )
  }

  // Regular field rendering
  function renderEditable() {
    return (
      <Controller
        control={form.control}
        name={field.key}
        defaultValue={options.defaultValue || ''}
        rules={{ required: options.required }}
        render={({ field: { onChange, value } }) => {
          const selectedValues = stringToArray(value, separator)
          const handleCheckboxChange = createCheckboxChangeHandler(onChange, selectedValues)

          return (
            <div className={clsx(groupTheme.wrapper)}>
              <div className={clsx(
                groupTheme.container,
                options.checkboxDirection !== 'row' 
                  ? groupTheme.containerColumn 
                  : groupTheme.containerRow
              )}>
                {options.checkboxOptions.map((option: CheckboxGroupOption) => {
                  const isChecked = selectedValues.includes(String(option.value))
                  const isDisabled = options.disabled
                  return renderOption(option, isChecked, !!isDisabled, handleCheckboxChange)
                })}
              </div>
            </div>
          )
        }}
      />
    )
  }

  if (isReadOnly) {
    return renderReadOnly()
  }
  
  return renderEditable()
} 