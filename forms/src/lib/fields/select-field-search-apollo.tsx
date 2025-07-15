import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { singleSelectDisplayValue } from './search-select-helpers'
import { useApolloSearch } from './use-apollo-search'

export function SelectFieldSearchApollo<
  TDataItem extends { id: string; name?: string; firstName?: string; lastName?: string }
>({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.SearchSelectApollo }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const { options, loading: apolloLoading, handleSearchChange } = useApolloSearch<TDataItem>(field.options)

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