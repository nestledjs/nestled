import { Controller } from 'react-hook-form'
import Select from 'react-select'
import { WebUiFormFieldProps } from '../web-ui-form'
import { Option } from '../web-ui-form-fields'
import './web-ui-select-field-style.css'

export function WebUiSelectField(props: WebUiFormFieldProps) {
  const defaultValue = props.field?.options?.selectOptions?.find((o) => o.value === props.field?.options?.defaultValue)

  if (props.renderStatic) {
    return props.field?.options?.defaultValue?.toString()
  }

  if (props.field?.options?.useController) {
    return (
      <Controller
        name={props.field.key}
        control={props.control}
        defaultValue={defaultValue?.value}
        render={({ field: { onChange, value, ...field } }) => (
          <Select
            {...field}
            menuPortalTarget={document.body}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 999 }) }}
            value={props.field?.options?.selectOptions?.find((o) => o.value === value)}
            onChange={(selected: Option) => {
              onChange(selected?.value ?? null)
              if (props.onChange) {
                props.onChange(selected ?? null)
              }
            }}
            isDisabled={props.field?.options?.disabled}
            options={props.field?.options?.selectOptions}
            isClearable={!props.field.options.required}
            className="react-select-container"
            classNamePrefix="react-select"
            menuPlacement="auto"
          />
        )}
      />
    )
  }

  function onChange(selected: Option) {
    if (props.onChange) {
      props.onChange(selected ?? null)
    }
    if (props.setValue) {
      props.setValue(props.field?.key, selected?.value ?? null)
    }
  }

  return (
    <Select
      name={props.field.key}
      menuPortalTarget={document.body}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 999 }) }}
      defaultValue={defaultValue}
      isDisabled={props.field?.options?.disabled}
      key={props.field.key}
      options={props.field?.options?.selectOptions}
      onChange={onChange}
      isClearable={!props.field.options.required}
      className="react-select-container"
      classNamePrefix="react-select"
      menuPlacement="auto"
    />
  )
}
