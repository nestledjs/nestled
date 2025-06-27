import { formatDateFromDateTime, getDateFromDateTime } from '../utils/date-time'
import { Controller } from 'react-hook-form'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

export function DatePickerField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.DatePicker }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="date"
          className={clsx('text-green_web py-1.5 border-gray-300 focus:border-gray-300 rounded w-full focus:outline-none',
            hasError ? 'border-red-600 focus:ring-red-600' : 'focus:ring-green_web active:ring-green_web',
          )}
          disabled={true}
          value={value}
        />
      );
    }
    // Render as plain value (formatted)
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{formatDateFromDateTime(value || '') || '—'}</div>
    );
  }

  if (field.options.useController) {
    return (
      <Controller
        name={field.key}
        control={form.control}
        defaultValue={getDateFromDateTime(field.options.defaultValue || '')}
        render={({ field: { value, onChange, ...controllerField } }) => (
          <input
            {...controllerField}
            value={value || ''}
            type="date"
            max="9999-12-31"
            contentEditable={false}
            disabled={field.options.disabled}
            className={clsx(
              'text-green_web py-1.5 border-gray-300 focus:border-gray-300 rounded w-full focus:outline-none',
              hasError ? 'border-red-600 focus:ring-red-600' : 'focus:ring-green_web active:ring-green_web',
            )}
            onChange={(e) => {
              onChange(e.target.value)
            }}
          />
        )}
      />
    )
  }
  return (
    <input
      id={field.key}
      type="date"
      max="9999-12-31"
      contentEditable={false}
      disabled={field.options.disabled}
      defaultValue={getDateFromDateTime(field.options.defaultValue || '') || ''}
      {...form.register(field.key, {
        required: field.options.required,
        setValueAs: (v) => (v ? v.split('T')[0] : ''),
      })}
      onChange={(val) => {
        // Optionally handle onChange
      }}
      className={clsx(
        'text-green_web py-1.5 border-gray-300 focus:border-gray-300 rounded w-full focus:outline-none',
        hasError ? 'border-red-600 focus:ring-red-600' : 'focus:ring-green_web active:ring-green_web',
      )}
    />
  )
}
