import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { SelectedItems, multiSelectDisplayValue } from './search-select-helpers'
import { useFormTheme } from '../theme-context'
import { useApolloSearch } from './use-apollo-search'

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
  const { options, loading: apolloLoading, handleSearchChange } = useApolloSearch<TDataItem>(field.options)

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