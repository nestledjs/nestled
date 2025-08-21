import { useQuery } from '@apollo/client'
import { useEffect, useState, useCallback } from 'react'
import { SearchSelectOption, SearchSelectApolloOptions } from '../form-types'
import { defaultOptionsMap } from './search-select-helpers'

type RequiredItemShape = { id: string; name?: string; firstName?: string; lastName?: string }

export function useApolloSearch<TDataItem extends RequiredItemShape>(
  fieldOptions: SearchSelectApolloOptions<TDataItem>
) {
  const { data, loading: apolloLoading, refetch } = useQuery(fieldOptions.document)
  const [options, setOptions] = useState<SearchSelectOption[]>(fieldOptions.initialOptions || [])

  // Destructure specific properties for more precise dependency tracking
  const { filter, selectOptionsFunction, dataType, searchFields, initialOptions } = fieldOptions

  const processData = useCallback(
    (dataList: TDataItem[]) => {
      let processedList = dataList
      if (filter) {
        processedList = filter(processedList)
      }
      
      const apolloOptions = selectOptionsFunction
        ? selectOptionsFunction(processedList)
        : defaultOptionsMap(processedList)
      
      // Merge initial options with Apollo results, avoiding duplicates
      if (initialOptions && initialOptions.length > 0) {
        const apolloValues = new Set(apolloOptions.map(opt => opt.value))
        const uniqueInitialOptions = initialOptions.filter(opt => !apolloValues.has(opt.value))
        
        // Put initial options first, then Apollo options
        return [...uniqueInitialOptions, ...apolloOptions]
      }
      
      return apolloOptions
    },
    [filter, selectOptionsFunction, initialOptions],
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
      } else {
        // When search is cleared, reset to initial Apollo data merged with initial options
        if (data) {
          setOptions(processData(data[dataType] ?? []))
        }
      }
    },
    [refetch, searchFields, dataType, processData, data],
  )

  return {
    options,
    loading: apolloLoading,
    handleSearchChange,
  }
} 