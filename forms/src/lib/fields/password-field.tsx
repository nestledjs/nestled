import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { inputStyle } from '../styles/input-style'

export function PasswordField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Password }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="password"
          className={clsx(inputStyle, hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          value={value}
        />
      );
    }
    // Render as masked value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{'*'.repeat(value.length) || '—'}</div>
    );
  }

  return (
    <input
      id={field.key}
      type="password"
      disabled={field.options.disabled}
      placeholder={field.options.placeholder}
      defaultValue={field.options.defaultValue}
      {...form.register(field.key, { required: field.options.required })}
      className={clsx(inputStyle, hasError && '!border-red-600 !focus:border-red-600')}
    />
  )
}
