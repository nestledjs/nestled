import React from 'react';
import clsx from 'clsx';
import { FormFieldProps, FormField, FormFieldType, CustomCheckboxOptions } from '../form-types';
import { useFormTheme } from '../theme-context';

export function CustomCheckboxField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
  theme: themeProp,
}: FormFieldProps<Extract<FormField, { type: FormFieldType.CustomCheckbox }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled', theme?: any }) {
  const contextTheme = useFormTheme();
  const theme = (themeProp ? themeProp.checkbox : contextTheme.checkbox);
  const options = field.options as CustomCheckboxOptions;
  const isReadOnly = options.readOnly ?? formReadOnly;
  const readOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);
  const fullWidthLabel = options.fullWidthLabel;
  const wrapperClassNames = options.wrapperClassNames;

  // Accessible label
  const label = (
    <label
      htmlFor={field.key}
      className={clsx(theme.label, fullWidthLabel && theme.fullWidthLabel, 'cursor-pointer select-none')}
    >
      {options.label}
      {options.required && <span style={{ color: 'red', marginLeft: 2 }}>*</span>}
    </label>
  );

  const helpText = options.helpText ? (
    <div className={clsx(theme.helpText)}>{options.helpText}</div>
  ) : null;

  const errorText = hasError && options.errorText ? (
    <div className={clsx(theme.errorText)}>{options.errorText}</div>
  ) : null;

  if (isReadOnly) {
    return (
      <div className={clsx(theme.wrapper, wrapperClassNames)}>
        <span
          className={clsx(
            'inline-flex items-center justify-center w-5 h-5 rounded border border-gray-300',
            value ? 'bg-green-500 border-green-500' : 'bg-white',
            'mr-2',
            'opacity-60',
          )}
        >
          {value && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        {label}
        {helpText}
        {errorText}
      </div>
    );
  }

  return (
    <div className={clsx(theme.wrapper, wrapperClassNames)}>
      <div className={clsx(fullWidthLabel ? 'flex justify-between items-center' : 'flex items-center')}>        
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            id={field.key}
            type="checkbox"
            disabled={options.disabled}
            defaultChecked={options.defaultValue}
            {...form.register(field.key, {
              required: options.required,
            })}
            className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
            aria-invalid={hasError}
            aria-checked={value}
            aria-disabled={options.disabled}
          />
          <span
            className={clsx(
              'inline-flex items-center justify-center w-5 h-5 rounded border border-gray-300 transition-colors',
              'mr-2',
              'bg-white',
              options.disabled && 'opacity-50 cursor-not-allowed',
              hasError && 'border-red-600',
              value && 'bg-green-500 border-green-500',
              'peer-focus:ring-2 peer-focus:ring-green-400 peer-focus:ring-offset-2',
            )}
          >
            {value && (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        </label>
        {label}
      </div>
      {helpText}
      {errorText}
    </div>
  );
} 