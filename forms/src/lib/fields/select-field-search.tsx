import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { singleSelectDisplayValue } from './search-select-helpers'

export function SelectFieldSearch({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.SearchSelect }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const value = form.getValues(field.key)
  const selectedOption = field.options.options.find(o => o.value === value) ?? null

  return (
    <SearchSelectBase
      form={form}
      field={field}
      hasError={hasError}
      formReadOnly={formReadOnly}
      formReadOnlyStyle={formReadOnlyStyle}
      options={field.options.options}
      value={selectedOption}
      onChange={(option) => form.setValue(field.key, option?.value || null)}
      displayValue={singleSelectDisplayValue}
      themeKey="searchSelectField"
    />
  )
} 