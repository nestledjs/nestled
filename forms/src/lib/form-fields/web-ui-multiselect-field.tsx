import { useEffect, useState } from 'react'
import Select from 'react-select'
import { WebUiFormFieldProps } from '../web-ui-form'
import { Option } from '../web-ui-form-fields'
import './web-ui-select-field-style.css'

export function WebUiMultiSelectField(props: WebUiFormFieldProps) {
  const [selectedOptions, setSelectedOptions] = useState<Option[]>()

  useEffect(() => {
    const defaultOptions = []
    props.field?.options?.selectOptions?.forEach((o) => {
      if (props.field?.options?.defaultValue?.includes(o.value)) {
        defaultOptions.push(o)
      }
    })
    setSelectedOptions(defaultOptions)
  }, [props.field?.options?.defaultValue])

  function onOptionSelect(selected: Option) {
    const newSelectedOptions = selectedOptions
    if (newSelectedOptions?.includes(selected)) {
      const toDeleteIndex = newSelectedOptions.findIndex((o) => o?.value === selected?.value)
      newSelectedOptions.splice(toDeleteIndex, 1)
    } else {
      newSelectedOptions.push(selected)
    }
    setSelectedOptions(newSelectedOptions)
    setValue(newSelectedOptions?.map((o) => o.value))
  }

  function setValue(selected: string[]) {
    if (props.onChange) {
      props.onChange(selected)
    }
    if (props.setValue) {
      props.setValue(props.field.key, selected)
    }
  }

  function onChange(selected) {
    setSelectedOptions(selected)
    setValue(selected?.map((o) => o.value))
  }
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <div>
      <input id={props.field?.key} defaultValue={selectedOptions?.map((o) => o.value)} hidden />
      {props.field?.options?.dropdownSelect ? (
        <Select
          name={props.field.key}
          key={props.field.key}
          {...props.field?.options}
          options={props.field?.options?.selectOptions}
          onChange={onChange}
          isMulti={true}
          isClearable={!props.field.options.required}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      ) : (
        props.field?.options?.selectOptions?.map((option) => (
          <div key={option.key + '_+container'}>
            <input
              onChange={() => onOptionSelect(option)}
              type="checkbox"
              id={option.key}
              name={option.key}
              value={option.value}
              defaultChecked={selectedOptions?.includes(option)}
              className="h-4 w-4 text-green_web focus:text-green_400_web focus:outline-none focus:ring-2 focus:ring-green_web focus:ring-offset-2 border-gray-300 rounded"
            />
            <label htmlFor={option.key} className="text-sm ml-2">
              {option.label}
            </label>
          </div>
        ))
      )}
    </div>
  )
}
