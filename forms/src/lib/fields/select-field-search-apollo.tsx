import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { singleSelectDisplayValue } from './search-select-helpers'
import { useApolloSearch } from './use-apollo-search'
import { useWatch } from 'react-hook-form'
import { useMemo } from 'react'

/**
 * Submit transformation for single Apollo search - converts option object to ID string
 */
export function singleSelectSubmitTransform(value: any): string | null {
  if (!value) {
    return null
  }
  
  // If it's already a string (ID), return it
  if (typeof value === 'string') {
    return value
  }
  
  // If it's an option object, extract the value
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value
  }
  
  // Fallback: convert to string
  return String(value)
}

export function SelectFieldSearchApollo<
  TDataItem extends { id: string; name?: string; firstName?: string; lastName?: string }
>({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.SearchSelectApollo }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  // Automatically ensure the field has the submit transformation
  // This converts option objects to ID strings for API submission
  if (!field.options.submitTransform) {
    field.options.submitTransform = singleSelectSubmitTransform
  }
  
  const { options, loading: apolloLoading, handleSearchChange } = useApolloSearch<TDataItem>(field.options)

  // Use useWatch to get reactive form value updates
  const watchedValue = useWatch({
    control: form.control,
    name: field.key,
  })

  // Process the current form value to get the selected option
  const selectedOption = useMemo(() => {
    if (!watchedValue) {
      return null
    }
    
    // If it's already a proper option object, use it directly
    if (watchedValue && typeof watchedValue === 'object' && 'value' in watchedValue && 'label' in watchedValue) {
      return watchedValue
    }
    
    // If it's a string (ID), try to find the matching option from Apollo data
    if (typeof watchedValue === 'string') {
      const foundInApollo = options.find((option) => option.value === watchedValue)
      if (foundInApollo) {
        return foundInApollo
      }
      
      // If not found in Apollo data yet, create temporary option with ID as label
      return {
        value: watchedValue,
        label: watchedValue,
      }
    }
    
    // Handle unexpected format - convert to temporary option
    const id = String(watchedValue)
    return {
      value: id,
      label: id,
    }
  }, [watchedValue, options])

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
      onChange={(option) => {
        // Store the full option object (like multi-search) instead of just the ID
        // Submit transformation will convert back to ID for API submission
        form.setValue(field.key, option || null)
      }}
      displayValue={singleSelectDisplayValue}
      themeKey="searchSelectField"
    />
  )
} 