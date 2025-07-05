import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { Controller } from 'react-hook-form'
import { useState, ReactNode } from 'react'
import clsx from 'clsx'
import { SearchSelectOption } from '../form-types'
import { useDebounce } from '../utils/debounce'
import { ClientOnly } from '../utils/client-only'
import { useFormTheme } from '../theme-context'

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
  const theme = useFormTheme()
  const fieldTheme = theme[themeKey as keyof typeof theme] as any
  
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
  
  // Read-only state logic
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const readOnlyValue = displayValue(value)
  
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
          value={readOnlyValue}
          readOnly
        />
      )
    }
    return (
      <div className={fieldTheme.readOnlyValue}>
        {readOnlyValue || '—'}
      </div>
    )
  }
  
  return (
    <ClientOnly fallback={<div className="h-10 w-full rounded-md border border-gray-300 bg-gray-100" />}>
      <Controller
        control={form.control}
        name={field.key}
        defaultValue={field.options.defaultValue}
        rules={{ required: field.options.required }}
        render={({ field: { onChange: onFieldChange, value: fieldValue, onBlur } }) => (
          <Combobox
            value={fieldValue}
            onChange={onFieldChange}
            multiple={multiple}
            onClose={() => {
              setSearchTerm('')
              onClose?.()
            }}
            disabled={field.options.disabled}
          >
            <div className={fieldTheme.container}>
              <div
                className={clsx(
                  fieldTheme.inputContainer || fieldTheme.container,
                  hasError && fieldTheme.error,
                  field.options.disabled && fieldTheme.disabled
                )}
              >
                {renderSelectedItems?.(fieldValue, onFieldChange)}
                <ComboboxInput
                  className={fieldTheme.input}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  onBlur={onBlur}
                  displayValue={displayValue}
                  placeholder={field.options.placeholder || field.options.label}
                  disabled={field.options.disabled}
                />
              </div>
              <ComboboxButton 
                className={fieldTheme.button}
                disabled={field.options.disabled}
              >
                <svg
                  className={fieldTheme.buttonIcon}
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
            <ComboboxOptions className={fieldTheme.dropdown}>
              {loading && <div className={fieldTheme.loadingText}>Loading...</div>}
              {filteredOptions.length === 0 && !loading ? (
                renderNoResults?.(!!searchTerm) || (
                  <div className={fieldTheme.loadingText || fieldTheme.noResultsText}>
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
                        fieldTheme.option,
                        active ? fieldTheme.optionActive : 'text-gray-900'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={clsx(
                            fieldTheme.optionLabel,
                            selected ? fieldTheme.optionSelected : 'font-normal'
                          )}
                        >
                          {option.label}
                        </span>
                        {selected && (
                          <span className={fieldTheme.optionCheckIcon}>
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
      />
    </ClientOnly>
  )
} 