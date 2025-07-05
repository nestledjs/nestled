import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { SelectField } from './select-field'

export function SelectFieldEnum({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.EnumSelect }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  // Transform enum to select options
  const selectOptions = Object.entries(field.options.enum || {}).map(([label, value]) => ({ 
    label, 
    value: String(value) 
  }))
  
  // Create a Select field with the transformed options
  const selectField: Extract<FormField, { type: FormFieldType.Select }> = {
    ...field,
    type: FormFieldType.Select,
    options: {
      ...field.options,
      options: selectOptions
    }
  }
  
  return (
    <SelectField 
      form={form} 
      field={selectField} 
      hasError={hasError} 
      formReadOnly={formReadOnly}
      formReadOnlyStyle={formReadOnlyStyle}
    />
  )
} 