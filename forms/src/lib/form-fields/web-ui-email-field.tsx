import { WebUiFormFieldProps, inputStyle } from '../web-ui-form'

export function WebUiEmailField(props: WebUiFormFieldProps) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <input
      id={props.field.key}
      type="email"
      autoComplete="true"
      disabled={props.field?.options?.disabled}
      placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
      defaultValue={props.field?.options?.defaultValue}
      {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
      className={`${inputStyle}  ${props.hasError ? '!border-red-600 !focus:border-red-600' : ''}`}
    />
  )
}
