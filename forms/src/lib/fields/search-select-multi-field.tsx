import { useQuery } from '@apollo/client'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { Controller } from 'react-hook-form'
import { useEffect, useState, useCallback } from 'react'
import clsx from 'clsx'
import { SearchSelectOption, FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useDebounce } from '../utils/debounce'
import { ClientOnly } from '../utils/client-only'
import { useFormTheme } from '../theme-context'

type RequiredItemShape = { id: string; name?: string; firstName?: string; lastName?: string }

function defaultOptionsMap<TDataItem extends { id: string; name?: string; firstName?: string; lastName?: string }>(
  items: TDataItem[],
): SearchSelectOption[] {
  return items.map((option) => ({
    value: `${option.id}`,
    label: option.name ?? `${option.firstName} ${option.lastName}`,
  }))
}

function SelectedItems({
  value,
  onChange,
  theme,
}: {
  value: SearchSelectOption[]
  onChange: (items: SearchSelectOption[]) => void
  theme: any
}) {
  return (
    <>
      {value.map((item: SearchSelectOption) => (
        <span key={item.value} className={theme.searchSelectMultiField.selectedItem}>
          <span className={theme.searchSelectMultiField.selectedItemLabel}>{item.label}</span>
          <button
            type="button"
            className={theme.searchSelectMultiField.selectedItemRemoveButton}
            onClick={() => onChange(value.filter((v: SearchSelectOption) => v.value !== item.value))}
          >
            <svg
              className={theme.searchSelectMultiField.selectedItemRemoveIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
    </>
  )
}

function ComboboxOptionsList({
  options,
  apolloLoading,
  theme,
}: {
  options: SearchSelectOption[]
  apolloLoading: boolean
  theme: any
}) {
  return (
    <ComboboxOptions className={theme.searchSelectMultiField.dropdown}>
      {apolloLoading && <div className={theme.searchSelectMultiField.loadingText}>Loading...</div>}
      {options.map((option) => (
        <ComboboxOption
          key={option.value}
          value={option}
          className={({ active }) =>
            clsx(
              theme.searchSelectMultiField.option,
              active ? theme.searchSelectMultiField.optionActive : 'text-gray-900',
            )
          }
        >
          {({ selected }) => (
            <>
              <span
                className={clsx(
                  theme.searchSelectMultiField.optionLabel,
                  selected ? theme.searchSelectMultiField.optionSelected : 'font-normal',
                )}
              >
                {option.label}
              </span>
              {selected && (
                <span className={theme.searchSelectMultiField.optionCheckIcon}>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
  )
}

export function SearchSelectMultiField<TDataItem extends RequiredItemShape>({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.SearchSelectMulti }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()
  const { data, loading: apolloLoading, refetch } = useQuery(field.options.document)
  const [searchTerm, setSearchTerm] = useState('')
  const [options, setOptions] = useState<SearchSelectOption[]>([])
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const processData = useCallback(
    (dataList: TDataItem[]) => {
      let processedList = dataList
      if (field.options.filter) processedList = field.options.filter(processedList)
      return field.options.selectOptionsFunction
        ? field.options.selectOptionsFunction(processedList)
        : defaultOptionsMap(processedList)
    },
    [field.options],
  )

  useEffect(() => {
    if (!apolloLoading && data) setOptions(processData(data[field.options.dataType] ?? []))
  }, [apolloLoading, data, field.options.dataType, processData])

  useEffect(() => {
    if (debouncedSearchTerm) {
      refetch({ input: { search: debouncedSearchTerm } }).then((res) => {
        setOptions(processData(res.data?.[field.options.dataType] ?? []))
      })
    }
  }, [debouncedSearchTerm, refetch, field.options, processData])

  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? []
  const selectedLabels = Array.isArray(value) ? value.map((v: any) => v.label ?? v).join(', ') : ''

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          type="text"
          className={clsx(theme.searchSelectMultiField.readOnlyInput, hasError && theme.searchSelectMultiField.error)}
          disabled={true}
          value={selectedLabels}
        />
      )
    }
    // Render as plain value
    return <div className={theme.searchSelectMultiField.readOnlyValue}>{selectedLabels || '—'}</div>
  }

  return (
    <ClientOnly fallback={<div className="min-h-[2.5rem] w-full rounded-md border border-gray-300 bg-gray-100" />}>
      <Controller
        control={form.control}
        name={field.key}
        defaultValue={field.options.defaultValue ?? []}
        rules={{ required: field.options.required }}
        render={({ field: { onChange, value = [] } }) => (
          <Combobox
            multiple
            value={value}
            onChange={(items) => {
              onChange(items)
              setSearchTerm('') // Clear search input after selection
            }}
          >
            <div className={theme.searchSelectMultiField.container}>
              <div
                className={clsx(
                  theme.searchSelectMultiField.inputContainer,
                  hasError && theme.searchSelectMultiField.error,
                )}
              >
                <SelectedItems value={value} onChange={onChange} theme={theme} />
                <ComboboxInput
                  className={theme.searchSelectMultiField.input}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={value.length === 0 ? field.options.label : ''}
                />
              </div>
              <ComboboxButton className={theme.searchSelectMultiField.button}>
                <svg className={theme.searchSelectMultiField.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </ComboboxButton>
            </div>
            <ComboboxOptionsList options={options} apolloLoading={apolloLoading} theme={theme} />
          </Combobox>
        )}
      />
    </ClientOnly>
  )
}
