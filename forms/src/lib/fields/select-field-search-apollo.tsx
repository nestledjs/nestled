import { useQuery } from '@apollo/client'
import { useEffect, useState, useCallback } from 'react'
import { SearchSelectOption, FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { singleSelectDisplayValue, defaultOptionsMap } from './search-select-helpers'

export function SelectFieldSearchApollo<
  TDataItem extends { id: string; name?: string; firstName?: string; lastName?: string }
>({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.SearchSelectApollo }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const { data, loading: apolloLoading, refetch } = useQuery(field.options.document)
  const [options, setOptions] = useState<SearchSelectOption[]>([])

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

  const handleSearchChange = useCallback((searchTerm: string) => {
    if (searchTerm) {
      refetch({ input: { search: searchTerm } }).then((res) => {
        setOptions(processData(res.data?.[field.options.dataType] ?? []))
      })
    }
  }, [refetch, field.options, processData])

  const value = form.getValues(field.key)
  const selectedOption = options.find((o) => o.value === value) ?? null

  return (
    <SearchSelectBase
      form={form}
      field={field}
      hasError={hasError}
      formReadOnly={formReadOnly}
      formReadOnlyStyle={formReadOnlyStyle}
      options={options}
      loading={apolloLoading}
      onSearchChange={handleSearchChange}
      searchDebounceMs={500}
      value={selectedOption}
      onChange={(option) => form.setValue(field.key, option?.value || null)}
      displayValue={singleSelectDisplayValue}
      themeKey="searchSelectField"
    />
  )
} 