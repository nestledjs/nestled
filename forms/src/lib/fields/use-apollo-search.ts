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

  // Destructure specific properties for more precise dependency tracking
  const { filter, selectOptionsFunction, dataType, searchFields } = fieldOptions

  const processData = useCallback(
    (dataList: TDataItem[]) => {
      let processedList = dataList
      if (filter) {
        processedList = filter(processedList)
      }
      return selectOptionsFunction
        ? selectOptionsFunction(processedList)
        : defaultOptionsMap(processedList)
    },
    [filter, selectOptionsFunction],
  )

  useEffect(() => {
    if (!apolloLoading && data) {
      setOptions(processData(data[dataType] ?? []))
    }
  }, [apolloLoading, data, dataType, processData])

  const handleSearchChange = useCallback(
    (searchTerm: string) => {
      if (searchTerm) {
        const input: { search: string; searchFields?: string[] } = { search: searchTerm }
        if (searchFields && searchFields.length > 0) {
          input.searchFields = searchFields
        }
        refetch({ input }).then((res) => {
          setOptions(processData(res.data?.[dataType] ?? []))
        })
      }
    },
    [refetch, searchFields, dataType, processData],
  )

  return {
    options,
    loading: apolloLoading,
    handleSearchChange,
  }
} 