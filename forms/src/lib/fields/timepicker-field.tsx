import clsx from 'clsx'
import { FormFieldProps, FormFieldType, BaseFieldOptions } from '../form-types'
import { useFormTheme } from '../theme-context'

interface TimePickerFieldType {
  key: string
  type: FormFieldType.TimePicker
  options: BaseFieldOptions
}

export function TimePickerField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<TimePickerFieldType> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const theme = useFormTheme()
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key) ?? '';

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <>
          <input
            id={field.key}
            type="time"
            className={clsx(
              theme.timePickerField.input,
              theme.timePickerField.disabled,
              hasError && theme.timePickerField.error
            )}
            disabled={true}
            value={value}
          />
          {field.options.helpText && (
            <div className={clsx(theme.timePickerField.helpText)}>{field.options.helpText}</div>
          )}
        </>
      );
    }
    // Render as plain value
    return (
      <>
        <div className={theme.timePickerField.readOnlyValue}>{value ? value : '—'}</div>
        {field.options.helpText && (
          <div className={clsx(theme.timePickerField.helpText)}>{field.options.helpText}</div>
        )}
      </>
    );
  }

  return (
    <>
      <input
        id={field.key}
        type="time"
        disabled={field.options.disabled}
        defaultValue={field.options.defaultValue}
        required={field.options.required}
        {...form.register(field.key, {
          required: field.options.required,
          //   setValueAs: (v) => v?.split?.('T')[1],
        })}
        className={clsx(
          theme.timePickerField.input,
          field.options.disabled && theme.timePickerField.disabled,
          hasError && theme.timePickerField.error
        )}
      />
      {field.options.helpText && (
        <div className={clsx(theme.timePickerField.helpText)}>{field.options.helpText}</div>
      )}
    </>
  )
}
