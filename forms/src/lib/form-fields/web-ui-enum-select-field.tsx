import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiEnumSelectField(props: WebUiFormFieldProps) {
  if (props.renderStatic) {
    return props.field?.options?.defaultValue?.toString()
  }
  return (
    <select
      id={props.field?.key}
      defaultValue={props.field?.options?.defaultValue}
      disabled={props.field?.options?.disabled}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      {...props.register(`${props.field.key}`, {
        required: props.field?.options?.required,
      })}
    >
      {(Object.keys(props.field.options.enum as object) as Array<keyof typeof props.field.options.enum>)?.map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  )
}
