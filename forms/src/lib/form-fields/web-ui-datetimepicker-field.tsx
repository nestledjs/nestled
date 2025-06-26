import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiDateTimePickerField(props: WebUiFormFieldProps) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <input
      id={props.field.key}
      type="datetime-local"
      disabled={props.field?.options?.disabled}
      defaultValue={props.field?.options?.defaultValue}
      {...props.register(`${props.field.key}`, {
        required: props.field?.options?.required,
        valueAsDate: true,
      })}
      className={`text-green_web focus:ring-green_web border-gray-300 rounded w-full ${
        props.hasError ? '!border-red-600 !focus:border-red-600' : ''
      }`}
    />
  )
}
