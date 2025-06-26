import { Label, Switch, SwitchGroup } from '@headlessui/react'
import classNames from 'classnames'
import { Controller } from 'react-hook-form'
import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiSwitchField(props: WebUiFormFieldProps) {
  return (
    <SwitchGroup as="div" key={props.field?.key} className="flex items-center justify-between">
      <Label as="span" className="ml-3">
        <span className="text-md text-grey_web">{props?.field?.options?.label}</span>
      </Label>
      <Controller
        key={props.field?.key}
        disabled={props.field?.options?.disabled || props.renderStatic}
        control={props.control}
        name={props.field.key}
        defaultValue={props.field?.options?.defaultValue}
        render={({ field: { onChange, value } }) => (
          <Switch
            {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
            checked={value}
            onChange={onChange}
            className={classNames(
              value ? 'bg-green_web' : 'bg-gray-200',
              'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green_web',
            )}
          >
            <span
              aria-hidden="true"
              className={classNames(
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
