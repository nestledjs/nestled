import React from 'react'
import { Controller } from 'react-hook-form'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType, CheckboxGroupOption, CheckboxGroupOptions } from '../form-types'
import { useFormTheme } from '../theme-context'

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
  const options: CheckboxGroupOptions = field.options

  // Determine read-only state with field-level precedence
  const isReadOnly = options.readOnly ?? formReadOnly
  const readOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle

  // Get separator for value parsing (default: comma)
  const separator = options.valueSeparator ?? ','

  // Utility functions for value conversion
  const stringToArray = (value: string | null | undefined): string[] => {
    if (!value || value.trim() === '') return []
    return value.split(separator).map(v => v.trim()).filter(v => v !== '')
  }

  const arrayToString = (values: string[]): string => {
    return values.join(separator)
  }

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
      
      onChange(arrayToString(newSelectedValues))
    }
  }

  // Extract option rendering to reduce nesting
  const renderOption = (option: CheckboxGroupOption, isChecked: boolean, isDisabled: boolean, handleChange: (optionValue: string | number, checked: boolean) => void) => {
    if (option.hidden) return null

    return (
      <div 
        key={option.key} 
        className={clsx(
          theme.checkboxGroup.optionContainer,
          options.fullWidthLabel && theme.checkboxGroup.optionContainerFullWidth,
          options.fancyStyle && theme.checkboxGroup.optionContainerFancy
        )}
      >
        <div className={clsx(theme.checkboxGroup.checkboxContainer)}>
          <input
            type="checkbox"
            id={`${field.key}_${option.key}`}
            checked={isChecked}
            onChange={(e) => handleChange(option.value, e.target.checked)}
            disabled={isDisabled}
            className={clsx(
              theme.checkboxGroup.input,
              options.fullWidthLabel && theme.checkboxGroup.inputFullWidth,
              isChecked && theme.checkboxGroup.inputChecked,
              theme.checkboxGroup.inputFocus,
              isDisabled && theme.checkboxGroup.inputDisabled,
              hasError && theme.checkboxGroup.error
            )}
          />
          <label 
            htmlFor={`${field.key}_${option.key}`}
            className={clsx(
              theme.checkboxGroup.label,
              options.fullWidthLabel && theme.checkboxGroup.labelFullWidth,
              options.checkboxDirection !== 'row' 
                ? theme.checkboxGroup.labelColumn 
                : theme.checkboxGroup.labelRow
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
    <div key={option.key} className={clsx(theme.checkboxGroup.optionContainer)}>
      <div className={clsx(theme.checkboxGroup.checkboxContainer)}>
        <input
          type="checkbox"
          checked={isChecked}
          disabled={true}
          className={clsx(
            theme.checkboxGroup.input,
            theme.checkboxGroup.inputDisabled,
            isChecked && theme.checkboxGroup.inputChecked
          )}
          readOnly
        />
        <label className={clsx(theme.checkboxGroup.label)}>
          {option.label}
        </label>
      </div>
    </div>
  )

  // Handle read-only rendering
  function renderReadOnly() {
    const value = form.getValues(field.key)
    const selectedValues = stringToArray(value)
    const selectedOptions = options.checkboxOptions.filter(opt => 
      selectedValues.includes(String(opt.value))
    )

    if (readOnlyStyle === 'disabled') {
      return (
        <div className={clsx(theme.checkboxGroup.wrapper)}>
          <div className={clsx(
            theme.checkboxGroup.container,
            options.checkboxDirection !== 'row' 
              ? theme.checkboxGroup.containerColumn 
              : theme.checkboxGroup.containerRow
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
      <div className={clsx(theme.checkboxGroup.readOnlyValue)}>
        {selectedOptions.length > 0 ? (
          <div className={clsx(theme.checkboxGroup.readOnlyContainer)}>
            {selectedOptions.map((option, index) => (
              <div key={option.key} className={clsx(theme.checkboxGroup.readOnlySelected)}>
                <span>✓ {option.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={clsx(theme.checkboxGroup.readOnlyUnselected)}>
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
          const selectedValues = stringToArray(value)
          const handleCheckboxChange = createCheckboxChangeHandler(onChange, selectedValues)

          return (
            <div className={clsx(theme.checkboxGroup.wrapper)}>
              <div className={clsx(
                theme.checkboxGroup.container,
                options.checkboxDirection !== 'row' 
                  ? theme.checkboxGroup.containerColumn 
                  : theme.checkboxGroup.containerRow
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