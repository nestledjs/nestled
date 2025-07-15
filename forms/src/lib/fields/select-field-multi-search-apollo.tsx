import { useQuery } from '@apollo/client'
import { useEffect, useState, useCallback } from 'react'
import { SearchSelectOption, FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { SelectedItems, multiSelectDisplayValue, defaultOptionsMap } from './search-select-helpers'
import { useFormTheme } from '../theme-context'

type RequiredItemShape = { id: string; name?: string; firstName?: string; lastName?: string }

export function SelectFieldMultiSearchApollo<TDataItem extends RequiredItemShape>({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.SearchSelectMultiApollo }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()
  const { data, loading: apolloLoading, refetch } = useQuery(field.options.document)
  const [options, setOptions] = useState<SearchSelectOption[]>([])

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

  const handleSearchChange = useCallback((searchTerm: string) => {
    if (searchTerm) {
      const input: { search: string; searchFields?: string[] } = { search: searchTerm }
      if (field.options.searchFields && field.options.searchFields.length > 0) {
        input.searchFields = field.options.searchFields
      }
      refetch({ input }).then((res) => {
        setOptions(processData(res.data?.[field.options.dataType] ?? []))
      })
    }
  }, [refetch, field.options, processData])

  const value = form.getValues(field.key) ?? []

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
      value={value}
      onChange={(items) => form.setValue(field.key, items)}
      displayValue={multiSelectDisplayValue}
      multiple={true}
      themeKey="searchSelectMultiField"
      renderSelectedItems={(value, onChange) => (
        <SelectedItems 
          value={value} 
          onChange={onChange} 
          theme={theme.searchSelectMultiField} 
        />
      )}
    />
  )
} 