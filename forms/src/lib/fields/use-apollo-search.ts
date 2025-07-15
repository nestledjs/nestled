import { useQuery } from '@apollo/client'
import { useEffect, useState, useCallback } from 'react'
import { SearchSelectOption, SearchSelectApolloOptions } from '../form-types'
import { defaultOptionsMap } from './search-select-helpers'

type RequiredItemShape = { id: string; name?: string; firstName?: string; lastName?: string }

export function useApolloSearch<TDataItem extends RequiredItemShape>(
  fieldOptions: SearchSelectApolloOptions<TDataItem>
) {
  const { data, loading: apolloLoading, refetch } = useQuery(fieldOptions.document)
  const [options, setOptions] = useState<SearchSelectOption[]>([])

  const processData = useCallback(
    (dataList: TDataItem[]) => {
      let processedList = dataList
      if (fieldOptions.filter) {
        processedList = fieldOptions.filter(processedList)
      }
      return fieldOptions.selectOptionsFunction
        ? fieldOptions.selectOptionsFunction(processedList)
        : defaultOptionsMap(processedList)
    },
    [fieldOptions],
  )

  useEffect(() => {
    if (!apolloLoading && data) {
      setOptions(processData(data[fieldOptions.dataType] ?? []))
    }
  }, [apolloLoading, data, fieldOptions.dataType, processData])

  const handleSearchChange = useCallback(
    (searchTerm: string) => {
      if (searchTerm) {
        const input: { search: string; searchFields?: string[] } = { search: searchTerm }
        if (fieldOptions.searchFields && fieldOptions.searchFields.length > 0) {
          input.searchFields = fieldOptions.searchFields
        }
        refetch({ input }).then((res) => {
          setOptions(processData(res.data?.[fieldOptions.dataType] ?? []))
        })
      }
    },
    [refetch, fieldOptions, processData],
  )

  return {
    options,
    loading: apolloLoading,
    handleSearchChange,
  }
} 