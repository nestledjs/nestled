import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { SelectedItems, multiSelectDisplayValue } from './search-select-helpers'
import { useFormTheme } from '../theme-context'
import { multiSelectSubmitTransform } from './select-field-multi-search-apollo'
import { useMemo } from 'react'

export function SelectFieldMultiSearch({
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
  
  // Create field configuration with submit transformation without mutating original
  const fieldOptions = useMemo(() => ({
    ...field.options,
    submitTransform: field.options.submitTransform ?? multiSelectSubmitTransform
  }), [field.options])
  
  const value = form.getValues(field.key) ?? []

  return (
    <SearchSelectBase
      form={form}
      field={field}
      hasError={hasError}
      formReadOnly={formReadOnly}
      formReadOnlyStyle={formReadOnlyStyle}
      options={fieldOptions.options || []}
      loading={fieldOptions.loading}
      onSearchChange={fieldOptions.onSearchChange}
      searchDebounceMs={fieldOptions.searchDebounceMs}
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