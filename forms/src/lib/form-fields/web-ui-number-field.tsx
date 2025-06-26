import { inputStyle, WebUiFormFieldProps } from '../web-ui-form'

export function WebUiNumberField(props: Readonly<WebUiFormFieldProps>) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <input
      id={props.field.key}
      type="number"
      disabled={props.field?.options?.disabled}
      placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
      defaultValue={props.field?.options?.defaultValue}
      {...props.register(`${props.field.key}`, { required: props.field?.options?.required, valueAsNumber: true })}
      className={`${inputStyle}  ${props.hasError ? '!border-red-600 !focus:border-red-600' : ''}`}
    />
  )
}
