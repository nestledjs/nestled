import { inputStyle, WebUiFormFieldProps } from '../web-ui-form'
import './web-ui-money-field-style.css'

export function WebUiMoneyField(props: Readonly<WebUiFormFieldProps>) {
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <div id="money" className="flex flex-row items-center">
      <div id="moneySign">$</div>
      <input
        id={props.field.key}
        type="number"
        step="0.01"
        disabled={props.field?.options?.disabled}
        placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
        defaultValue={props.field?.options?.defaultValue}
        {...props.register(`${props.field.key}`, { required: props.field?.options?.required, valueAsNumber: true })}
        className={`${inputStyle} ${props.hasError ? '!border-red-600 !focus:border-red-600' : ''}`}
      />
    </div>
  )
}
