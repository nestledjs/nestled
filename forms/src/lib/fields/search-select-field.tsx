import { useQuery } from '@apollo/client'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { Controller } from 'react-hook-form'
import { useEffect, useState, useCallback } from 'react'
import clsx from 'clsx'
import { SearchSelectOption, FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useDebounce } from '../utils/debounce'
import { ClientOnly } from '../utils/client-only'

function defaultOptionsMap<TDataItem extends { id: string; name?: string; firstName?: string; lastName?: string }>(
  items: TDataItem[],
): SearchSelectOption[] {
  return items.map((option) => ({
    value: `${option.id}`,
    label: option.name ?? `${option.firstName} ${option.lastName}`,
  }))
}

export function SearchSelectField<
  TDataItem extends { id: string; name?: string; firstName?: string; lastName?: string }
>({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.SearchSelect }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const { data, loading: apolloLoading, refetch } = useQuery(field.options.document)
  const [searchTerm, setSearchTerm] = useState('')
  const [options, setOptions] = useState<SearchSelectOption[]>([])
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const processData = useCallback((dataList: TDataItem[]) => {
    let processedList = dataList
    if (field.options.filter) {
      processedList = field.options.filter(processedList)
    }
    return field.options.selectOptionsFunction
      ? field.options.selectOptionsFunction(processedList)
      : defaultOptionsMap(processedList)
  }, [field.options])

  useEffect(() => {
    if (!apolloLoading && data) {
      setOptions(processData(data[field.options.dataType] ?? []))
    }
  }, [apolloLoading, data, field.options.dataType, processData])

  useEffect(() => {
    if (debouncedSearchTerm) {
      refetch({ input: { search: debouncedSearchTerm } }).then((res) => {
        setOptions(processData(res.data?.[field.options.dataType] ?? []))
      })
    }
  }, [debouncedSearchTerm, refetch, field.options, processData])

  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);
  const selectedOption = options.find((o) => o.value === value) ?? null;

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
        control={form.control}
        name={field.key}
        defaultValue={field.options.defaultValue}
        rules={{ required: field.options.required }}
        render={({ field: { onChange, value, onBlur } }) => (
          <Combobox<SearchSelectOption | null> value={value} onChange={onChange} nullable>
            <div className="relative">
              <ComboboxInput
                className={clsx('w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10', hasError && '!border-red-600 !focus:border-red-600')}
                onChange={(event) => setSearchTerm(event.target.value)}
                onBlur={onBlur}
                displayValue={(option: SearchSelectOption | null) => option?.label ?? ''}
                placeholder={field.options.label}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                <svg
                  className="h-5 w-5 text-gray-400"
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
            <ComboboxOptions className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {apolloLoading && <div className="p-2 text-sm text-gray-500">Loading...</div>}
              {options.map((option) => (
                <ComboboxOption
                  key={option.value}
                  value={option}
                  className={({ active }) =>
                    `cursor-default select-none relative py-2 pl-10 pr-4 ${
                      active ? 'text-white bg-orange-600' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600">
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
              ))}
            </ComboboxOptions>
          </Combobox>
        )}
      />
    </ClientOnly>
  )
}
