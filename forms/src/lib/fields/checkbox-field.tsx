import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import React from 'react'

export function CheckboxField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Checkbox }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const options = field.options

  const isReadOnly = options.readOnly ?? formReadOnly;
  const readOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);

  const label = (
    <label
      htmlFor={field.key}
      className={clsx(options.labelTextSize || 'ml-2 mt-0.5 block text-xs sm:text-sm text-gray-900')}
    >
      {options.label}
    </label>
  )

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          id={field.key}
          type="checkbox"
          className={clsx('h-4 w-4 text-green_web border-gray-300 rounded', hasError && '!border-red-600 !focus:border-red-600')}
          disabled={true}
          checked={!!value}
          readOnly
        />
      );
    }
    // Render as icon/plain value
    return value ? (
      <CheckIcon className="w-5 h-5 text-green_web" />
    ) : (
      <XMarkIcon className="w-5 h-5 text-red-600" />
    );
  }

  const input = (
    <input
      id={field.key}
      type="checkbox"
      disabled={options.disabled}
      defaultChecked={options.defaultValue}
      {...form.register(field.key, {
        required: options.required,
      })}
      className={clsx(
        'h-4 w-4 text-green_web focus:text-green_400_web focus:outline-none focus:ring-2 focus:ring-green_web focus:ring-offset-2 border-gray-300 rounded',
        hasError && '!border-red-600 !focus:border-red-600',
      )}
    />
  )

  const fullWidthLabel = options.fullWidthLabel
  const wrapperClassNames = options.wrapperClassNames

  return options.customWrapper ? (
    options.customWrapper(
      fullWidthLabel
        ? [
            React.cloneElement(label, { key: 'label' }),
            React.cloneElement(input, { key: 'input' }),
          ]
        : [
            React.cloneElement(input, { key: 'input' }),
            React.cloneElement(label, { key: 'label' }),
          ]
    )
  ) : (
    <div
      key={`${field.key}_wrapper`}
      className={clsx('flex items-center', fullWidthLabel ? 'justify-between' : 'justify-start', wrapperClassNames)}
    >
      {fullWidthLabel ? label : null}
      {input}
      {!fullWidthLabel ? label : null}
    </div>
  )
}
