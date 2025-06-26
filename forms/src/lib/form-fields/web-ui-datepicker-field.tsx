import { formatDateFromDateTime, getDateFromDateTime } from '@tmi-nx-v2/shared-utils'
import dayjs from 'dayjs'
import { Controller } from 'react-hook-form'
import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiDatePickerField(props: Readonly<WebUiFormFieldProps>) {
  if (props.renderStatic) {
    return formatDateFromDateTime(props.field?.options?.defaultValue)
  }
  if (props.field?.options?.useController) {
    return (
      <Controller
        name={props.field.key}
        control={props.control}
        defaultValue={getDateFromDateTime(props.field?.options?.defaultValue)}
        render={({ field: { value, onChange, ...field } }) => (
          <input
            {...field}
            value={value || ''}
            type="date"
            max="9999-12-31"
            contentEditable={false}
            disabled={props.field?.options?.disabled}
            className={`text-green_web py-1.5 border-gray-300 focus:border-gray-300 rounded w-full focus:outline-none
                ${props.hasError ? 'border-red-600 focus:ring-red-600' : 'focus:ring-green_web active:ring-green_web'}
              `}
            onChange={(e) => {
              onChange(e.target.value)
              if (props.onChange) {
                props.onChange(dayjs(e.target.value).toDate())
              }
            }}
          />
        )}
      />
    )
  }
  return (
    <input
      id={props.field.key}
      type="date"
      max="9999-12-31"
      contentEditable={false}
      disabled={props.field?.options?.disabled}
      defaultValue={getDateFromDateTime(props.field?.options?.defaultValue)}
      {...props.register(`${props.field.key}`, {
        required: props.field?.options?.required,
        setValueAs: (v) => v?.split?.('T')[0],
      })}
      onChange={(val) => {
        if (props.onChange) {
          props.onChange(dayjs(val?.target?.value).toDate())
        }
      }}
      className={`text-green_web py-1.5 border-gray-300 focus:border-gray-300 rounded w-full focus:outline-none
        ${props.hasError ? 'border-red-600 focus:ring-red-600' : 'focus:ring-green_web active:ring-green_web'}
      `}
    />
  )
}
