import { inputStyle, WebUiFormFieldProps } from '../web-ui-form'

export function WebUiTextAreaField(props: WebUiFormFieldProps) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <textarea
      rows={4}
      id={props.field.key}
      disabled={props.field?.options?.disabled}
      placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
      defaultValue={props.field?.options?.defaultValue}
      className={`${inputStyle} block w-full resize-none  ${
        props.hasError ? '!border-red-600 !focus:border-red-600' : ''
      }`}
      {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
    />
  )
}
