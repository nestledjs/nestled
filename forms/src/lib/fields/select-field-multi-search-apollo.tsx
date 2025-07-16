import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { SelectedItems, multiSelectDisplayValue } from './search-select-helpers'
import { useFormTheme } from '../theme-context'
import { useApolloSearch } from './use-apollo-search'
import { useWatch } from 'react-hook-form'
import { SearchSelectOption } from '../form-types'
import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * Generic utility function to transform multi-select values from display format to submission format.
 * Converts from SearchSelectOption[] (display format) to string[] (API format).
 * 
 * This transformation is automatically applied to Apollo multi-search components, but can also be
 * used manually for custom form handling or non-Apollo multi-select fields.
 * 
 * @example
 * ```tsx
 * // Automatic usage (no need to configure)
 * const field = {
 *   key: 'variants',
 *   type: FormFieldType.SearchSelectMultiApollo,
 *   options: {
 *     label: 'Select Variants',
 *     document: SEARCH_VARIANTS_QUERY,
 *     dataType: 'variants',
 *     // submitTransform is applied automatically!
 *   }
 * }
 * 
 * // Manual usage for custom handling
 * const transformedValues = multiSelectSubmitTransform(formValues.selectedItems)
 * ```
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

/**
 * @deprecated Use multiSelectSubmitTransform instead. This alias is kept for backward compatibility.
 */
export const apolloMultiSelectSubmitTransform = multiSelectSubmitTransform

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
  // Automatically ensure the field has the submit transformation
  // This converts option objects to ID arrays for API submission
  if (!field.options.submitTransform) {
    field.options.submitTransform = multiSelectSubmitTransform
  }
  const theme = useFormTheme()
  const { options, loading: apolloLoading, handleSearchChange } = useApolloSearch<TDataItem>(field.options)

  // Cache for selected options to preserve labels when they're not in current search results
  const [selectedOptionsCache, setSelectedOptionsCache] = useState<Map<string, SearchSelectOption>>(new Map())

  // Use useWatch to get reactive form value updates
  const watchedValue = useWatch({
    control: form.control,
    name: field.key,
  }) ?? []

  // Convert form IDs to option objects, using cache to preserve labels
  // Use useMemo to recalculate when watchedValue, options, or cache changes
  const processedValue: SearchSelectOption[] = useMemo(() => {
    if (!Array.isArray(watchedValue)) {
      return []
    }
    
    return watchedValue.map((item): SearchSelectOption => {
      // If the item is already a proper option object, use it directly
      if (item && typeof item === 'object' && 'value' in item && 'label' in item) {
        return item
      }
      
      // Handle legacy case where form might still have ID strings
      if (typeof item === 'string') {
        const itemId = item
        
        // Try current Apollo options first (most up-to-date)
        const foundInCurrent = options.find((option) => option.value === itemId)
        if (foundInCurrent) {
          return foundInCurrent
        }
        
        // Fall back to cached option (preserves label when not in current search)
        const foundInCache = selectedOptionsCache.get(itemId)
        if (foundInCache) {
          return foundInCache
        }
        
        // Last resort: create temporary option with ID as label
        return {
          value: itemId,
          label: itemId,
        }
      }
      
      // Handle unexpected format
      const itemId = String(item)
      return {
        value: itemId,
        label: itemId,
      }
    })
  }, [watchedValue, options, selectedOptionsCache])

  // Update cache whenever new options come from Apollo
  useEffect(() => {
    if (options.length > 0) {
      setSelectedOptionsCache(prevCache => {
        // Check if any new options are actually different
        let hasChanges = false
        for (const option of options) {
          if (!prevCache.has(option.value)) {
            hasChanges = true
            break
          }
        }
        
        // Only create new Map if there are actual changes
        if (!hasChanges) {
          return prevCache
        }
        
        const newCache = new Map(prevCache)
        options.forEach(option => {
          newCache.set(option.value, option)
        })
        return newCache
      })
    }
  }, [options])

  // Custom onChange handler that updates the cache for newly selected items
  const handleChange = useCallback((items: SearchSelectOption[]) => {
    // Update cache with any new selections
    setSelectedOptionsCache(prevCache => {
      let hasChanges = false
      const newCache = new Map(prevCache)
      
      items.forEach(item => {
        if (!newCache.has(item.value)) {
          newCache.set(item.value, item)
          hasChanges = true
        }
      })
      
      // Only return new Map if there are actual changes
      return hasChanges ? newCache : prevCache
    })
    
    // Store full option objects in form (like regular multi-search) instead of just IDs
    form.setValue(field.key, items)
  }, [form, field.key])

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
      onChange={handleChange}
      displayValue={multiSelectDisplayValue}
      multiple={true}
      themeKey="searchSelectMultiField"
      renderSelectedItems={(value, onChange) => (
        <SelectedItems 
          value={processedValue} 
          onChange={handleChange} 
          theme={theme.searchSelectMultiField} 
        />
      )}
    />
  )
} 