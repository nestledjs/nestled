import 'react-phone-number-input/style.css'
import './phone-field.css'
import { useEffect } from 'react'
import { isPossiblePhoneNumber } from 'react-phone-number-input'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

export function PhoneField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Phone }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  function validatePhone(val: string) {
    return val === undefined || val === '' || isPossiblePhoneNumber((val ?? '')?.toString(), 'US')
  }

  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="tel"
          className={clsx('w-full', hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          value={value}
        />
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{value ?? '—'}</div>
    );
  }

  return (
    <>
      <input
        id={field.key}
        type="tel"
        disabled={field.options.disabled}
        placeholder={field.options.placeholder}
        defaultValue={field.options.defaultValue}
        {...form.register(field.key, {
          validate: (v) => validatePhone(v),
        })}
        className={clsx('w-full', hasError && '!border-red-600 !focus:border-red-600')}
      />
      {hasError && <div className="text-2xs sm:text-sm mt-2 mx-1 text-red-700">* Phone number is invalid</div>}
    </>
  )
}
