import { Combobox, ComboboxInput, ComboboxButton, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useState } from 'react'
import clsx from 'clsx'
import { FormFieldProps, FormField, FormFieldType } from '../form-types'
import { ClientOnly } from '../utils/client-only'
import { useDebounce } from '../utils/debounce'
import './select-field-style.css'
import { Controller } from 'react-hook-form'

// Extracted component for rendering selected items
function SelectedItems({ value, onChange }: { value: { label: string; value: string | number }[]; onChange: (val: any) => void }) {
  return (
    <>
      {value.map((item) => (
        <span
          key={item.value}
          className="flex items-center gap-x-1 whitespace-nowrap rounded-sm bg-orange-100 px-2 py-0.5 text-sm text-orange-700"
        >
          {item.label}
          <button
            type="button"
            className="text-orange-500 hover:text-orange-800"
            onClick={() => onChange(value.filter((v) => v.value !== item.value))}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
    </>
  );
}

// Extracted component for rendering options
function MultiSelectOptions({ filteredOptions }: { filteredOptions: { label: string; value: string | number }[] }) {
  return (
    <ComboboxOptions className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
      {filteredOptions.map((option) => (
        <ComboboxOption
          key={option.value}
          value={option}
          className={({ active }) =>
            clsx(
              'cursor-pointer select-none relative py-2 pl-10 pr-4',
              active ? 'bg-orange-100 text-orange-900' : 'text-gray-900'
            )
          }
        >
          {({ selected }) => (
            <>
              <span
                className={clsx(
                  'block truncate',
                  selected ? 'font-medium' : 'font-normal'
                )}
              >
                {option.label}
              </span>
              {selected ? (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600">
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
  );
}

// Extracted render function for Controller
function renderMultiSelectCombobox({
  value,
  onChange,
  hasError,
  setSearchTerm,
  field,
  filteredOptions,
}: {
  value: { label: string; value: string | number }[];
  onChange: (val: any) => void;
  hasError: boolean;
  setSearchTerm: (val: string) => void;
  field: any;
  filteredOptions: { label: string; value: string | number }[];
}) {
  return (
    <Combobox multiple value={value} onChange={onChange}>
      <div className="relative">
        <div
          className={clsx(
            'flex flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white p-1 pr-10 shadow-sm',
            hasError && '!border-red-600 !focus:border-red-600'
          )}
        >
          <SelectedItems value={value} onChange={onChange} />
          <ComboboxInput
            className="min-w-[6rem] flex-grow bg-transparent p-1 focus:ring-0 border-none"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={value.length === 0 ? field.options.label : ''}
          />
        </div>
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </ComboboxButton>
      </div>
      <MultiSelectOptions filteredOptions={filteredOptions} />
    </Combobox>
  );
}

export function MultiSelectField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.MultiSelect }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const options = field.options.options || []

  // Filter options by search term
  const filteredOptions = debouncedSearchTerm
    ? options.filter((option: { label: string; value: string | number }) =>
        option.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    : options

  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? [];
  const selectedLabels = Array.isArray(value) ? value.map((v: any) => v.label ?? v).join(', ') : '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          type="text"
          className={clsx('w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10', hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          value={selectedLabels}
        />
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{selectedLabels || '—'}</div>
    );
  }

  return (
    <ClientOnly fallback={<div className="min-h-[2.5rem] w-full rounded-md border border-gray-300 bg-gray-100" />}> 
      <Controller
        name={field.key}
        control={form.control}
        defaultValue={[]}
        render={({ field: { onChange, value = [] } }) =>
          renderMultiSelectCombobox({
            value,
            onChange,
            hasError,
            setSearchTerm,
            field,
            filteredOptions,
          })
        }
      />
    </ClientOnly>
  )
}
