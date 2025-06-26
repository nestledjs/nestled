import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { WebUiFormFieldProps } from '../web-ui-form'
import { WebUiCheckboxFormFieldOptions } from '../web-ui-form-fields'

export function WebUiCheckboxField(props: WebUiFormFieldProps) {
  const options: WebUiCheckboxFormFieldOptions = props.field?.options

  const label = (
    <label
      htmlFor={`${props?.field.key}`}
      className={`${options.labelClasses || 'ml-2 mt-0.5 block text-xs sm:text-sm text-gray-900'}`}
    >
      {props?.field?.options?.label}
    </label>
  )

  const input = (
    <input
      id={`${props.field.key}`}
      type="checkbox"
      {...props.register(`${props.field.key}`, {
        required: options?.required,
        value: options?.defaultValue,
      })}
      className="h-4 w-4 text-green_web focus:text-green_400_web focus:outline-none focus:ring-2 focus:ring-green_web focus:ring-offset-2 border-gray-300 rounded"
    />
  )
  return props.renderStatic ? (
    options?.defaultValue ? (
      <CheckIcon className="w-5 h-5 text-green_web" />
    ) : (
      <XMarkIcon className="w-5 h-5 text-red-600" />
    )
  ) : options?.customWrapper ? (
    options?.customWrapper(options?.fullWidthLabel ? [label, input] : [input, label])
  ) : (
    <div
      key={`${props.field?.key}_wrapper`}
      className={`flex items-center ${options?.fullWidthLabel ? 'justify-between' : 'justify-start'} ${
        options?.wrapperClassNames
      }`}
    >
      {options?.fullWidthLabel ? label : null}
      {input}
      {!options?.fullWidthLabel ? label : null}
    </div>
  )
}
