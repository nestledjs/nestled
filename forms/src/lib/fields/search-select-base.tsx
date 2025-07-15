import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useState, ReactNode } from 'react'
import clsx from 'clsx'
import { SearchSelectOption } from '../form-types'
import { useDebounce } from '../utils/debounce'
import { BaseSelectField } from './base-select-field'

export interface SearchSelectBaseProps<TValue> {
  // Form integration
  form: any
  field: any
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
  
  // Data and filtering
  options: SearchSelectOption[]
  loading?: boolean
  onSearchChange?: (search: string) => void
  searchDebounceMs?: number
  
  // Value handling
  value: TValue
  onChange: (value: TValue) => void
  displayValue: (value: TValue) => string
  
  // Combobox configuration
  multiple?: boolean
  onClose?: () => void
  
  // Theme
  themeKey: string // 'searchSelectField' | 'searchSelectMultiField'
  
  // Custom rendering
  renderSelectedItems?: (value: TValue, onChange: (value: TValue) => void) => ReactNode
  renderNoResults?: (hasSearch: boolean) => ReactNode
}

export function SearchSelectBase<TValue>({
  form,
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
  options,
  loading = false,
  onSearchChange,
  searchDebounceMs = 300,
  value,
  onChange,
  displayValue,
  multiple = false,
  onClose,
  themeKey,
  renderSelectedItems,
  renderNoResults,
}: SearchSelectBaseProps<TValue>) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounceMs)
  
  // Handle search changes
  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    if (onSearchChange) {
      onSearchChange(search)
    }
  }
  
  // Filter options for client-side search
  const filteredOptions = onSearchChange 
    ? options // Server-side filtering
    : debouncedSearchTerm
      ? options.filter((option) =>
          option.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      : options

  // Custom read-only value renderer
  const renderReadOnlyValue = (formValue: any) => {
    return displayValue(formValue)
  }

  return (
    <BaseSelectField
      form={form}
      field={field}
      hasError={hasError}
      formReadOnly={formReadOnly}
      formReadOnlyStyle={formReadOnlyStyle}
      themeKey={themeKey}
      renderReadOnlyValue={renderReadOnlyValue}
    >
      {({ fieldValue, onChange: onFieldChange, onBlur, isDisabled, theme }) => (
        <Combobox
          value={fieldValue}
          onChange={onFieldChange}
          multiple={multiple}
          onClose={() => {
            setSearchTerm('')
            onClose?.()
          }}
          disabled={isDisabled}
        >
          <div className={theme.container}>
            <div
              className={clsx(
                theme.inputContainer || theme.container,
                hasError && theme.error,
                isDisabled && theme.disabled
              )}
            >
              {renderSelectedItems?.(fieldValue, onFieldChange)}
              <ComboboxInput
                className={theme.input}
                onChange={(event) => handleSearchChange(event.target.value)}
                onBlur={onBlur}
                displayValue={displayValue}
                placeholder={field.options.placeholder || field.options.label}
                disabled={isDisabled}
              />
            </div>
            <ComboboxButton 
              className={theme.button}
              disabled={isDisabled}
            >
              <svg
                className={theme.buttonIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </ComboboxButton>
          </div>
          <ComboboxOptions className={theme.dropdown}>
            {loading && <div className={theme.loadingText}>Loading...</div>}
            {filteredOptions.length === 0 && !loading ? (
              renderNoResults?.(!!searchTerm) || (
                <div className={theme.loadingText || theme.noResultsText}>
                  {searchTerm ? 'No results found' : 'No options available'}
                </div>
              )
            ) : (
              filteredOptions.map((option) => (
                <ComboboxOption
                  key={option.value}
                  value={option}
                  className={({ active }) =>
                    clsx(
                      theme.option,
                      active ? theme.optionActive : 'text-gray-900'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={clsx(
                          theme.optionLabel,
                          selected ? theme.optionSelected : 'font-normal'
                        )}
                      >
                        {option.label}
                      </span>
                      {selected && (
                        <span className={theme.optionCheckIcon}>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Combobox>
      )}
    </BaseSelectField>
  )
} 