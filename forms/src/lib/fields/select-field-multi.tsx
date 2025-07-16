import { FormFieldProps, FormField, FormFieldType } from '../form-types'
import { SearchSelectBase } from './search-select-base'
import { SelectedItems } from './search-select-helpers'
import { useFormTheme } from '../theme-context'
import { multiSelectSubmitTransform } from './select-field-multi-search-apollo'

export function SelectFieldMulti({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.MultiSelect }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()
  
  // Ensure the field has submit transformation for form submission
  // The Form component looks for field.options.submitTransform during submission
  // eslint-disable-next-line no-param-reassign
  field.options.submitTransform ??= multiSelectSubmitTransform
  
  const value = form.getValues(field.key) ?? []

  // Convert SelectOption[] to SearchSelectOption[] by ensuring values are strings
  const searchOptions = (field.options?.options ?? []).map((option) => ({
    label: option.label,
    value: String(option.value),
  }))

  return (
    <SearchSelectBase
      form={form}
      field={field}
      hasError={hasError}
      formReadOnly={formReadOnly}
      formReadOnlyStyle={formReadOnlyStyle}
      options={searchOptions}
      // No search functionality - just client-side filtering handled by SearchSelectBase
      value={value}
      onChange={(newValue) => form.setValue(field.key, newValue)}
      displayValue={() => ''} // Always empty for multi-select
      multiple={true}
      themeKey="multiSelect"
      renderSelectedItems={(value, onChange) => (
        <SelectedItems value={value} onChange={onChange} theme={theme.multiSelect} />
      )}
    />
  )
}
