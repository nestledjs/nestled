import { WebUiSelect } from '@tmi-nx-v2/web-ui/select'
import { useEffect, useState } from 'react'
import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiSearchSelectField(props: WebUiFormFieldProps) {
  const [selected, setSelected] = useState<any | null>(props.field?.options?.defaultValue || null)

  useEffect(() => {
    // If defaultValue is set, update selected state
    if (props.field?.options?.defaultValue) {
      doSetSelected(props.field?.options?.defaultValue)
    }
  }, [props.field?.options?.defaultValue])

  function doSetSelected(selected) {
    setSelected(selected)
    props.setValue(props.field?.key, selected)
    if (props.field?.options?.onChange) {
      props.field?.options?.onChange(selected)
    }
  }
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <div className="w-full grow h-10 flex" style={{ width: '-webkit-fill-available' }}>
      <input
        hidden
        id={props.field.key}
        disabled={props.field?.options?.disabled}
        placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
        {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
      />
      <WebUiSelect
        document={props.field?.options?.document}
        indexType={props.field?.options?.indexType}
        input={props.field?.options?.input}
        selected={selected}
        setSelected={doSetSelected}
        displayValue={props.field?.options?.format}
        inputDisplayValue={props.field?.options?.format}
        placeholder={props.field?.options?.placeholder}
        defaultValue={null} // Start with a blank value
        autoSelectFirst={false} // Ensure the first value is not auto-selected
        hasError={props.hasError}
      />
    </div>
  )
}
