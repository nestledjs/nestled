import { WebUiFormFieldProps, inputStyle } from '../web-ui-form'

export function WebUiUrlField(props: WebUiFormFieldProps) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <input
      id={props.field.key}
      type="url"
      disabled={props.field?.options?.disabled}
      placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
      defaultValue={props.field?.options?.defaultValue}
      {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
      className={inputStyle}
    />
  )
}
