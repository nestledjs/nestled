import { Combobox, ComboboxInput, ComboboxButton, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useState } from 'react'
import clsx from 'clsx'
import { FormFieldProps, FormField, FormFieldType } from '../form-types'
import { ClientOnly } from '../utils/client-only'
import { useDebounce } from '../utils/debounce'
import { Controller } from 'react-hook-form'
import { useFormTheme } from '../theme-context'

function SelectedItems({ 
  value, 
  onChange, 
  theme 
}: { 
  value: { label: string; value: string | number }[]
  onChange: (val: any) => void
  theme: any
}) {
  return (
    <>
      {value.map((item) => (
        <span key={item.value} className={clsx(theme.selectedItem)}>
          <span className={clsx(theme.selectedItemLabel)}>{item.label}</span>
          <button
            type="button"
            className={clsx(theme.selectedItemRemoveButton)}
            onClick={() => onChange(value.filter((v) => v.value !== item.value))}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
    </>
  )
}

function MultiSelectOptions({ 
  filteredOptions, 
  theme 
}: { 
  filteredOptions: { label: string; value: string | number }[]
  theme: any
}) {
  return (
    <ComboboxOptions className={clsx(theme.dropdown)}>
      {filteredOptions.map((option) => (
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
              <span className={clsx(theme.optionLabel, selected && theme.optionSelected)}>
                {option.label}
              </span>
              {selected ? (
                <span className={clsx(theme.optionCheckIcon)}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : null}
            </>
          )}
        </ComboboxOption>
      ))}
    </ComboboxOptions>
  )
}

function renderMultiSelectCombobox({
  value,
  onChange,
  hasError,
  setSearchTerm,
  field,
  filteredOptions,
  theme,
  disabled,
}: {
  value: { label: string; value: string | number }[]
  onChange: (val: any) => void
  hasError: boolean
  setSearchTerm: (val: string) => void
  field: any
  filteredOptions: { label: string; value: string | number }[]
  theme: any
  disabled?: boolean
}) {
  return (
    <Combobox multiple value={value} onChange={onChange} disabled={disabled}>
      <div className={clsx(theme.container)}>
        <div
          className={clsx(
            theme.selectedItemsContainer,
            hasError && theme.error,
            disabled && theme.disabled
          )}
        >
          <SelectedItems value={value} onChange={onChange} theme={theme} />
          <ComboboxInput
            className={clsx(theme.input)}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={value.length === 0 ? field.options.placeholder || field.options.label : ''}
            disabled={disabled}
          />
        </div>
        <ComboboxButton className={clsx(theme.button)}>
          <svg className={clsx(theme.buttonIcon)} viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </ComboboxButton>
      </div>
      <MultiSelectOptions filteredOptions={filteredOptions} theme={theme} />
    </Combobox>
  )
}

export function MultiSelectField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.MultiSelect }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  // Get the fully resolved theme from the context
  const theme = useFormTheme()
  const multiSelectTheme = theme.multiSelect

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const options = field.options.options || []

  // Filter options by search term
  const filteredOptions = debouncedSearchTerm
    ? options.filter((option: { label: string; value: string | number }) =>
        option.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    : options

  // Determine read-only state with field-level precedence
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? []
  const selectedLabels = Array.isArray(value) ? value.map((v: any) => v.label ?? v).join(', ') : ''

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <div className={clsx(multiSelectTheme.wrapper)}>
          <input
            type="text"
            className={clsx(
              multiSelectTheme.readOnlyInput,
              multiSelectTheme.disabled,
              hasError && multiSelectTheme.error
            )}
            disabled={true}
            value={selectedLabels}
            readOnly
          />
        </div>
      )
    }
    // Render as formatted value
    return (
      <div className={clsx(multiSelectTheme.wrapper)}>
        <div className={clsx(multiSelectTheme.readOnlyValue)}>
          {selectedLabels || '—'}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(multiSelectTheme.wrapper)}>
      <ClientOnly fallback={<div className="min-h-[2.5rem] w-full rounded-md border border-gray-300 bg-gray-100" />}>
        <Controller
          name={field.key}
          control={form.control}
          defaultValue={field.options.defaultValue || []}
          render={({ field: { onChange, value = [] } }) =>
            renderMultiSelectCombobox({
              value,
              onChange,
              hasError,
              setSearchTerm,
              field,
              filteredOptions,
              theme: multiSelectTheme,
              disabled: field.options.disabled,
            })
          }
        />
      </ClientOnly>
    </div>
  )
}
