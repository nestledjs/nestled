import { inputStyle, WebUiFormFieldProps } from '../web-ui-form'

export function WebUiTextField(props: WebUiFormFieldProps) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <input
      id={props.field.key}
      disabled={props.field?.options?.disabled}
      autoComplete="true"
      placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
      defaultValue={props.field?.options?.defaultValue}
      {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
      className={`${inputStyle} ${props.hasError ? '!border-red-600 !focus:border-red-600' : ''}`}
    />
  )
}
