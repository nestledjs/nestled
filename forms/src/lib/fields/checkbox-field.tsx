import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import React from 'react'
import { useFormTheme } from '../theme-context'

function renderReadOnlyCheckbox({ value, readOnlyStyle, theme }: { value: any, readOnlyStyle: 'value' | 'disabled', theme: any }) {
  if (readOnlyStyle === 'disabled') {
    return (
      <input
        type="checkbox"
        className={clsx(theme.input.base, theme.input.disabled)}
        disabled={true}
        checked={!!value}
        readOnly
      />
    );
  }
  if (value && theme.readonlyCheckedIcon) return theme.readonlyCheckedIcon;
  if (!value && theme.readonlyUncheckedIcon) return theme.readonlyUncheckedIcon;
  // No icons for native checkbox, just show value
  return <span>{value ? 'true' : 'false'}</span>;
}

function renderCheckboxInput({
  field,
  form,
  options,
  hasError,
  theme,
}: {
  field: any,
  form: any,
  options: any,
  hasError: boolean,
  theme: any,
}) {
  const isDisabled = options.disabled;
  const isChecked = form.getValues(field.key);
  const isIndeterminate = options.indeterminate;
  return (
    <input
      id={field.key}
      type="checkbox"
      disabled={isDisabled}
      defaultChecked={options.defaultValue}
      {...form.register(field.key, {
        required: options.required,
      })}
      className={clsx(
        theme.input.base,
        theme.input.focus,
        isDisabled && theme.input.disabled,
        hasError && theme.input.error,
        isChecked && theme.input.checked,
        isIndeterminate && theme.input.indeterminate,
        options.inputClassName
      )}
      aria-invalid={hasError}
      aria-checked={isChecked}
      aria-disabled={isDisabled}
    />
  );
}

/**
 * CheckboxField component for rendering checkbox inputs in forms
 *
 * @param form - The react-hook-form instance
 * @param field - The field configuration
 * @param hasError - Whether the field has an error
 * @param formReadOnly - When true, makes the field read-only regardless of the field's readOnly option
 *                       This is useful for making an entire form read-only without changing each field
 * @param formReadOnlyStyle - Controls how read-only fields are displayed:
 *                           - 'value': Shows the value as text or using theme icons if available
 *                           - 'disabled': Shows the field as a disabled input
 * @param theme - Optional theme override
 */
export function CheckboxField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
  theme: themeProp,
}: FormFieldProps<Extract<FormField, { type: FormFieldType.Checkbox }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled', theme?: any }) {
  const contextTheme = useFormTheme();
  const theme = (themeProp ? themeProp.checkbox : contextTheme.checkbox);
  const options = field.options
  const isReadOnly = options.readOnly ?? formReadOnly;
  const readOnlyStyle = options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);

  const label = (
    <label
      htmlFor={field.key}
      className={clsx(theme.label, field.options.fullWidthLabel && theme.fullWidthLabel)}
    >
      {options.label}
      {options.required && <span style={{ color: 'red', marginLeft: 2 }}>*</span>}
    </label>
  )

  const helpText = options.helpText ? (
    <div className={clsx(theme.helpText)}>{options.helpText}</div>
  ) : null;

  const errorText = hasError && options.errorText ? (
    <div className={clsx(theme.errorText)}>{options.errorText}</div>
  ) : null;

  const fullWidthLabel = options.fullWidthLabel

  if (isReadOnly) {
    return (
      <div className={clsx(theme.wrapper, options.wrapperClassNames)}>
        <div className={clsx(fullWidthLabel ? theme.rowFullWidth : theme.row)}>
          {renderReadOnlyCheckbox({ value, readOnlyStyle, theme })}
          {label}
        </div>
        {helpText}
        {errorText}
      </div>
    );
  }

  const input = renderCheckboxInput({ field, form, options, hasError, theme });
  const wrapperClassNames = options.wrapperClassNames

  if (options.customWrapper) {
    let elements;
    if (fullWidthLabel) {
      elements = [React.cloneElement(label, { key: 'label' }), React.cloneElement(input, { key: 'input' })];
    } else {
      elements = [React.cloneElement(input, { key: 'input' }), React.cloneElement(label, { key: 'label' })];
    }
    return options.customWrapper(elements);
  }

  return (
    <div
      key={`${field.key}_wrapper`}
      className={clsx(theme.wrapper, wrapperClassNames)}
    >
      <div className={clsx(fullWidthLabel ? theme.rowFullWidth : theme.row)}>
        {input}
        {label}
      </div>
      {helpText}
      {errorText}
    </div>
  )
}
