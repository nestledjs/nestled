import { useState, ReactNode, useRef, useEffect, useCallback } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounceMs)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Handle search changes
  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
  }
  
  // Call onSearchChange with debounced term for server-side search
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm, onSearchChange])
  
  // Filter options for client-side search
  const filteredOptions = onSearchChange 
    ? options // Server-side filtering - use options as provided by parent
    : searchTerm
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options

  // Custom read-only value renderer
  const renderReadOnlyValue = (formValue: any) => {
    return displayValue(formValue)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === ' ') {
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        onClose?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        event.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Tab':
        setIsOpen(false)
        setHighlightedIndex(-1)
        onClose?.()
        break
    }
  }, [isOpen, highlightedIndex, filteredOptions, onClose])

  // Handle option selection
  const handleOptionSelect = (option: SearchSelectOption) => {
    if (multiple) {
      // For multi-select, toggle the option
      const currentValues = Array.isArray(value) ? value : []
      const isSelected = currentValues.some((item: any) => item?.value === option.value)
      
      if (isSelected) {
        // Remove the option
        const newValues = currentValues.filter((item: any) => item?.value !== option.value)
        onChange(newValues as TValue)
      } else {
        // Add the option
        onChange([...currentValues, option] as TValue)
      }
      
      // Clear search and keep dropdown open for multi-select
      setSearchTerm('')
      inputRef.current?.focus()
    } else {
      // For single select, set the value and close dropdown
      onChange(option as TValue)
      setIsOpen(false)
      setHighlightedIndex(-1)
      setSearchTerm('')
      onClose?.()
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true)
  }

  // Handle dropdown toggle
  const handleToggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false)
      setHighlightedIndex(-1)
      onClose?.()
    } else {
      setIsOpen(true)
      inputRef.current?.focus()
    }
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
      {({ fieldValue, onChange: onFieldChange, onBlur, isDisabled, theme }) => {
        // Wrap onChange to clear search term after selection in multi-select mode
        const handleSelectionChange = (newValue: any) => {
          onFieldChange(newValue)
          // Clear search term after selection for multi-select to allow immediate new search
          if (multiple) {
            setSearchTerm('')
          }
        }

        return (
          <div ref={containerRef} className={theme.container}>
            <div
              className={clsx(
                theme.inputContainer || theme.container,
                hasError && theme.error,
                isDisabled && theme.disabled
              )}
            >
              {renderSelectedItems?.(fieldValue, onFieldChange)}
              <input
                ref={inputRef}
                type="text"
                className={theme.input}
                value={
                  searchTerm || 
                  (!multiple && value && !isOpen ? displayValue(value) : '')
                }
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={(e) => {
                  // Delay blur to allow option clicks to register
                  setTimeout(() => {
                    if (!containerRef.current?.contains(document.activeElement)) {
                      setIsOpen(false)
                      setHighlightedIndex(-1)
                      onBlur()
                    }
                  }, 100)
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  multiple && Array.isArray(fieldValue) && fieldValue.length > 0
                    ? '' // No placeholder when items are selected in multi-select
                    : searchTerm 
                    ? '' // No placeholder when typing
                    : !multiple && value 
                    ? '' // No placeholder when we have a selected value (it's shown as the value)
                    : field.options.placeholder || field.options.label
                }
                disabled={isDisabled}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                role="combobox"
              />
            </div>
            <button
              type="button"
              className={theme.button}
              onClick={handleToggleDropdown}
              disabled={isDisabled}
              aria-label="Toggle dropdown"
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
            </button>
            
            {isOpen && (
              <div
                ref={dropdownRef}
                className={theme.dropdown}
                role="listbox"
                aria-label="Options"
              >
                {loading && <div className={theme.loadingText}>Loading...</div>}
                {filteredOptions.length === 0 && !loading ? (
                  renderNoResults?.(!!searchTerm) || (
                    <div className={theme.loadingText || theme.noResultsText}>
                      {searchTerm ? 'No results found' : 'No options available'}
                    </div>
                  )
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = multiple 
                      ? Array.isArray(fieldValue) && fieldValue.some((item: any) => item?.value === option.value)
                      : fieldValue?.value === option.value
                    const isHighlighted = index === highlightedIndex
                    
                    return (
                      <div
                        key={option.value}
                        className={clsx(
                          theme.option,
                          isHighlighted ? theme.optionActive : 'text-gray-900',
                          isSelected && theme.optionSelected
                        )}
                        onClick={() => handleOptionSelect(option)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span
                          className={clsx(
                            theme.optionLabel,
                            isSelected ? theme.optionSelected : 'font-normal'
                          )}
                        >
                          {option.label}
                        </span>
                        {isSelected && (
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
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      }}
    </BaseSelectField>
  )
} 