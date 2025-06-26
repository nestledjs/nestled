import { useEffect, useState } from 'react'
import { WebUiFormFieldProps } from '../web-ui-form'
import { Option } from '../web-ui-form-fields'
import './web-ui-select-field-style.css'

export function WebUiCustomField(props: WebUiFormFieldProps) {
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
  return props.renderStatic ? props.field?.options?.defaultValue?.toString() : props.field?.options?.customField(props)
}
