import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiTimePickerField(props: WebUiFormFieldProps) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <input
      id={props.field.key}
      type="time"
      disabled={props.field?.options?.disabled}
      defaultValue={props.field?.options?.defaultValue}
      {...props.register(`${props.field.key}`, {
        required: props.field?.options?.required,
        //   setValueAs: (v) => v?.split?.('T')[1],
      })}
      className="text-green_web focus:ring-green_web border-gray-300 rounded"
    />
  )
}
