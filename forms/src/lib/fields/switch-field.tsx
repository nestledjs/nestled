import { Label, Switch, SwitchGroup } from '@headlessui/react'
import clsx from 'clsx'
import { Controller } from 'react-hook-form'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'

export function SwitchField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Switch }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <SwitchGroup as="div" key={field.key} className="flex items-center justify-between">
          <Label as="span" className="ml-3">
            <span className="text-md text-grey_web">{field.options.label}</span>
          </Label>
          <Switch
            checked={value}
            disabled={true}
            className={clsx(
              value ? 'bg-green_web' : 'bg-gray-200',
              'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full',
              'cursor-not-allowed',
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                value ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
              )}
            />
          </Switch>
        </SwitchGroup>
      );
    }
    // Render as plain value
    return (
      <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{value ? 'On' : 'Off'}</div>
    );
  }

  return (
    <SwitchGroup as="div" key={field.key} className="flex items-center justify-between">
      <Label as="span" className="ml-3">
        <span className="text-md text-grey_web">{field.options.label}</span>
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
              value ? 'bg-green_web' : 'bg-gray-200',
              'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green_web',
              hasError && '!border-red-600 !focus:border-red-600',
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                value ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
              )}
            />
          </Switch>
        )}
      />
    </SwitchGroup>
  )
}
