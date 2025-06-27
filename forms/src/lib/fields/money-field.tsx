import clsx from 'clsx'
import React from 'react'
import { FormField, FormFieldType, FormFieldProps } from '../form-types'
import { inputStyle } from '../styles/input-style' // New location for shared styles
import './money-field-style.css'

// The component now accepts the new props structure and is strongly typed.
// We use `Extract` to get the specific member of the FormField union we care about.
export function MoneyField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Currency }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <div id="money" className="flex flex-row items-center">
          <div id="moneySign">$</div>
          <input
            id={field.key}
            type="number"
            step="0.01"
            disabled={true}
            value={value}
            className={clsx(inputStyle, { '!border-red-600 !focus:border-red-600': hasError })}
          />
        </div>
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">${value || '—'}</div>
    );
  }

  return (
    <div id="money" className="flex flex-row items-center">
      <div id="moneySign">$</div>
      <input
        id={field.key}
        type="number"
        step="0.01"
        // Use the `form` object from react-hook-form
        {...form.register(field.key, {
          required: field.options.required,
          valueAsNumber: true,
        })}
        // Access options directly from the `field` prop
        disabled={field.options.disabled}
        defaultValue={field.options.defaultValue}
        placeholder={field.options.placeholder}
        className={clsx(inputStyle, {
          '!border-red-600 !focus:border-red-600': hasError,
        })}
      />
    </div>
  )
}
