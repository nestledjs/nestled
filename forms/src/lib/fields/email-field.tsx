import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { inputStyle } from '../styles/input-style'

export function EmailField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Email }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="email"
          className={clsx(inputStyle, hasError && '!border-red-600 !focus:border-red-600')}
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
      type="email"
      autoComplete="true"
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      {...form.register(field.key, { required: field.options.required })}
      className={clsx(inputStyle, hasError && '!border-red-600 !focus:border-red-600')}
    />
  )
}
