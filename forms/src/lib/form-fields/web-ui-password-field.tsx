import { WebUiFormFieldProps, inputStyle } from '../web-ui-form'

export function WebUiPasswordField(props: WebUiFormFieldProps) {
  return props.renderStatic ? (
    '*'.repeat(props.field?.options?.defaultValue?.toString().length || 0)
  ) : (
    <input
      id={props.field.key}
      type="password"
      disabled={props.field?.options?.disabled}
      placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
      defaultValue={props.field?.options?.defaultValue}
      {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
      className={`${inputStyle}  ${props.hasError ? '!border-red-600 !focus:border-red-600' : ''}`}
    />
  )
}
