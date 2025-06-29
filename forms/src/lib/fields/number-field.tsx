import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

export function NumberField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Number }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
  const value = form.getValues(field.key) ?? ''

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="number"
          className={clsx(hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          value={value}
        />
      )
    }
    // Render as plain value
    return <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{value ?? '—'}</div>
  }

  return (
    <input
      id={field.key}
      type="number"
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      {...form.register(field.key, { required: field.options.required, valueAsNumber: true })}
      className={clsx(hasError && '!border-red-600 !focus:border-red-600')}
    />
  )
}
