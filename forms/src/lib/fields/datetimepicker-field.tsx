import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

export function DateTimePickerField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.DateTimePicker }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="datetime-local"
          className={clsx('text-green_web focus:ring-green_web border-gray-300 rounded w-full', hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          value={value}
        />
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{value || '—'}</div>
    );
  }

  return (
    <input
      id={field.key}
      type="datetime-local"
      disabled={field.options.disabled}
      defaultValue={field.options.defaultValue}
      {...form.register(field.key, {
        required: field.options.required,
        valueAsDate: true,
      })}
      className={clsx('text-green_web focus:ring-green_web border-gray-300 rounded w-full', hasError && '!border-red-600 !focus:border-red-600')}
    />
  )
}
