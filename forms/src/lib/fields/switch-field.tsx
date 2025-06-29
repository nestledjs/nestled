import { Label, Switch, SwitchGroup } from '@headlessui/react'
import clsx from 'clsx'
import { Controller } from 'react-hook-form'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

export function SwitchField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Switch }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const theme = useFormTheme()
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <SwitchGroup as="div" key={field.key} className={theme.switchField.container}>
          <Label as="span" className={theme.switchField.label}>
            <span>{field.options.label}</span>
          </Label>
          <Switch
            checked={value}
            disabled={true}
            className={clsx(
              theme.switchField.switchTrack,
              value ? theme.switchField.switchTrackOn : theme.switchField.switchTrackOff,
              theme.switchField.disabled,
              hasError && theme.switchField.error
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                theme.switchField.switchThumb,
                value ? theme.switchField.switchThumbOn : theme.switchField.switchThumbOff,
              )}
            />
          </Switch>
        </SwitchGroup>
      );
    }
    // Render as plain value
    return (
      <div className={theme.switchField.readOnlyValue}>{value ? 'On' : 'Off'}</div>
    );
  }

  return (
    <SwitchGroup as="div" key={field.key} className={theme.switchField.container}>
      <Label as="span" className={theme.switchField.label}>
        <span>{field.options.label}</span>
      </Label>
      <Controller
        key={field.key}
        disabled={field.options.disabled}
        control={form.control}
        name={field.key}
        defaultValue={field.options.defaultValue}
        render={({ field: { onChange, value } }) => (
          <Switch
            {...form.register(field.key, { required: field.options.required })}
            checked={value}
            onChange={onChange}
            className={clsx(
              theme.switchField.switchTrack,
              value ? theme.switchField.switchTrackOn : theme.switchField.switchTrackOff,
              field.options.disabled && theme.switchField.disabled,
              hasError && theme.switchField.error,
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                theme.switchField.switchThumb,
                value ? theme.switchField.switchThumbOn : theme.switchField.switchThumbOff,
              )}
            />
          </Switch>
        )}
      />
    </SwitchGroup>
  )
}
