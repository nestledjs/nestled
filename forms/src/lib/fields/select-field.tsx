import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType, SelectOption } from '../form-types'
import { ClientOnly } from '../utils/client-only'
import './select-field-style.css'
import { Controller } from 'react-hook-form'

export function SelectField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Select } | { type: FormFieldType.EnumSelect }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  // Support both Select and EnumSelect
  let options: SelectOption[] = []
  if (field.type === FormFieldType.Select) {
    options = field.options.options || []
  } else if (field.type === FormFieldType.EnumSelect) {
    options = Object.keys(field.options.enum || {}).map((key) => ({ label: key, value: key }))
  }
  const defaultValue = options.find((o) => o.value === field.options.defaultValue) || null
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);
  const selectedOption = options.find((o) => o.value === value) || null;

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          type="text"
          className={clsx('w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10', hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          value={selectedOption?.label ?? ''}
        />
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{selectedOption?.label ?? '—'}</div>
    );
  }

  return (
    <ClientOnly fallback={<div className="h-10 w-full rounded-md border border-gray-300 bg-gray-100" />}> 
      <Controller
        name={field.key}
        control={form.control}
        defaultValue={defaultValue?.value ?? null}
        render={({ field: { onChange, value } }) => (
          <Combobox
            value={options.find(o => o.value === value) ?? null}
            onChange={(selected: SelectOption | null) => onChange(selected?.value ?? null)}
            disabled={field.options.disabled}
          >
            <div className="relative">
              <ComboboxInput
                className={clsx(
                  'w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10',
                  hasError && '!border-red-600 !focus:border-red-600',
                  field.options.disabled && 'bg-gray-100 cursor-not-allowed',
                )}
                displayValue={(option: SelectOption | null) => option?.label ?? ''}
                placeholder={field.options.label}
                disabled={field.options.disabled}
              />
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
            <ComboboxOptions className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {options.map((option) => (
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
                      <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
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
          </Combobox>
        )}
      />
    </ClientOnly>
  )
}
