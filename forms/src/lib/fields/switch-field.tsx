import clsx from 'clsx'
import { Controller } from 'react-hook-form'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

type SwitchOptions = {
  defaultValue?: boolean;
  helpText?: string;
} & Partial<import('../form-types').BaseFieldOptions>;

export function SwitchField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Switch }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const theme = useFormTheme()
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <div className={theme.switchField.container}>
          <span
            id={`${field.key}-switch-label`}
            className={theme.switchField.label}
                >
        {field.options.label}
        {field.options.required && <span style={{ color: 'red' }}> *</span>}
      </span>
          <button
            disabled={true}
            className={clsx(
              theme.switchField.switchTrack,
              value ? theme.switchField.switchTrackOn : theme.switchField.switchTrackOff,
              theme.switchField.disabled,
              hasError && theme.switchField.error
            )}
            role="switch"
            aria-checked={value}
            aria-readonly="true"
            aria-labelledby={`${field.key}-switch-label`}
          >
            <span
              aria-hidden="true"
              className={clsx(
                theme.switchField.switchThumb,
                value ? theme.switchField.switchThumbOn : theme.switchField.switchThumbOff,
              )}
            />
          </button>
          {((field.options as any).helpText) && (
            <div className={theme.switchField.helpText}>{(field.options as any).helpText}</div>
          )}
        </div>
      );
    }
    // Render as plain value
    return (
      <div className={theme.switchField.readOnlyValue}>{value ? 'On' : 'Off'}</div>
    );
  }

  return (
    <div className={theme.switchField.container}>
      <span
        id={`${field.key}-switch-label`}
        className={theme.switchField.label}
      >
        {field.options.label}
        {field.options.required && <span style={{ color: 'red' }}> *</span>}
      </span>
      <Controller
        key={field.key}
        disabled={field.options.disabled}
        control={form.control}
        name={field.key}
        defaultValue={field.options.defaultValue}
        render={({ field: { onChange, value, onBlur } }) => (
          <div className="relative">
            {/* Hidden checkbox for accessibility and form integration */}
            <input
              id={field.key}
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              onBlur={onBlur}
              disabled={field.options.disabled}
              required={field.options.required}
              aria-describedby={((field.options as any).helpText) ? `${field.key}-help` : undefined}
              className="sr-only"
            />
            {/* Custom switch UI */}
            <button
              type="button"
              onClick={() => !field.options.disabled && onChange(!value)}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !field.options.disabled) {
                  e.preventDefault()
                  onChange(!value)
                }
              }}
              disabled={field.options.disabled}
              role="switch"
              aria-checked={value}
                              aria-labelledby={`${field.key}-switch-label`}
              aria-required={field.options.required}
              className={clsx(
                theme.switchField.switchTrack,
                value ? theme.switchField.switchTrackOn : theme.switchField.switchTrackOff,
                field.options.disabled && theme.switchField.disabled,
                hasError && theme.switchField.error,
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  theme.switchField.switchThumb,
                  value ? theme.switchField.switchThumbOn : theme.switchField.switchThumbOff,
                )}
              />
            </button>
          </div>
        )}
      />
      {((field.options as any).helpText) && (
        <div id={`${field.key}-help`} className={theme.switchField.helpText}>
          {(field.options as any).helpText}
        </div>
      )}
    </div>
  )
}
