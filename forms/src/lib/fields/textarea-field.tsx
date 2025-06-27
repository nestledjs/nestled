import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { inputStyle } from '../styles/input-style'

export function TextAreaField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.TextArea }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <textarea
          rows={field.options.rows ?? 4}
          id={field.key}
          className={clsx(inputStyle, 'block w-full resize-none', hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          value={value}
        />
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700 whitespace-pre-line">{value || '—'}</div>
    );
  }

  return (
    <textarea
      rows={field.options.rows ?? 4}
      id={field.key}
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      className={clsx(inputStyle, 'block w-full resize-none', hasError && '!border-red-600 !focus:border-red-600')}
      {...form.register(field.key, { required: field.options.required })}
    />
  )
}
