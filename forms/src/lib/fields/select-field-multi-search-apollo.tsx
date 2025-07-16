import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { SelectedItems, multiSelectDisplayValue } from './search-select-helpers'
import { useFormTheme } from '../theme-context'
import { useApolloSearch } from './use-apollo-search'
import { useWatch } from 'react-hook-form'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { SearchSelectOption } from '../form-types'

type RequiredItemShape = { id: string; name?: string; firstName?: string; lastName?: string }

/**
 * Submit transformation for multi-select components - converts option objects to ID arrays
 */
export function multiSelectSubmitTransform(value: any): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  
  return value.map((item) => {
    // If it's already a string (ID), return it
    if (typeof item === 'string') {
      return item
    }
    
    // If it's an option object, extract the value
    if (item && typeof item === 'object' && 'value' in item) {
      return item.value
    }
    
    // Fallback: convert to string
    return String(item)
  })
}

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
  // Automatically ensure the field has the submit transformation
  // This converts option objects to ID arrays for API submission
  if (!field.options.submitTransform) {
    field.options.submitTransform = multiSelectSubmitTransform
  }

  const theme = useFormTheme()
  const { options, loading: apolloLoading, handleSearchChange } = useApolloSearch<TDataItem>(field.options)

  // Use useWatch for reactive form value updates
  const watchedValue = useWatch({
    control: form.control,
    name: field.key,
  }) ?? []
  
  // Cache to store option labels even when they're not in current search results
  const [optionCache, setOptionCache] = useState<Map<string, SearchSelectOption>>(new Map())

  // Update cache when Apollo provides new options
  useEffect(() => {
    if (options.length > 0) {
      setOptionCache(prevCache => {
        const newCache = new Map(prevCache)
        let hasChanges = false
        
        options.forEach(option => {
          if (!newCache.has(option.value)) {
            newCache.set(option.value, option)
            hasChanges = true
          }
        })
        
        return hasChanges ? newCache : prevCache
      })
    }
  }, [options])

  // Process the current value to ensure we have labels
  const processedValue = useMemo(() => {
    return watchedValue.map((item: any) => {
      // If it's already a complete option object, use it
      if (item && typeof item === 'object' && 'value' in item && 'label' in item) {
        // Cache this option for future use
        const existingCached = optionCache.get(item.value)
        if (!existingCached) {
          setOptionCache(prev => {
            const newCache = new Map(prev)
            newCache.set(item.value, item)
            return newCache
          })
        }
        return item
      }
      
      // If it's just an ID, try to find the option
      const id = typeof item === 'object' && 'value' in item ? item.value : item
      const foundOption = options.find(opt => opt.value === id) || optionCache.get(id)
      
      if (foundOption) {
        return foundOption
      }
      
      // Fallback: create a basic option (this handles preloaded IDs)
      return { value: id, label: id }
    })
  }, [watchedValue, options, optionCache])

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
      value={processedValue}
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