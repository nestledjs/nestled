import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { TrashIcon } from '@heroicons/react/24/solid'
import { WebUiButton } from '@tmi-nx-v2/web-ui/button'
import { WebUiSelect } from '@tmi-nx-v2/web-ui/select'
import { useEffect, useState } from 'react'
import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiSearchSelectMultiField(props: WebUiFormFieldProps) {
  const [fields, setFields] = useState<any>({})
  const [numFields, setNumFields] = useState(0)
  const [vals, setVals] = useState<any>({})

  useEffect(() => initFields(), [])

  function initFields() {
    let index = 0
    const initialFields = {}
    const initialVals = {}
    props.field?.options?.defaultValue?.forEach((v) => {
      initialFields[index] = <WebUiSearchSelectSingleField index={index} />
      initialVals[index] = v
      index++
    })
    if (index === 0) {
      resetFields()
    } else {
      setNumFields(index)
      setVals(initialVals)
      setFields(initialFields)
    }
  }

  function resetFields() {
    setFields([<WebUiSearchSelectSingleField index={0} />])
    setNumFields(1)
    setVals([null])
  }
  function deleteVal(index) {
    const newFields = {}
    delete fields[index]
    Object.keys(fields).forEach((i) => {
      if (fields[i] !== undefined) newFields[i] = fields[i]
    })
    setFields(newFields)
    const newVals = {}
    delete vals[index]

    Object.keys(vals).forEach((j) => {
      if (vals[j] !== undefined) newVals[j] = vals[j]
    })
    setVals(newVals)
    props.setValue(props.field.key, Object.values(newVals))
    if (Object.keys(newFields)?.length === 0) {
      resetFields()
    }
  }

  function addVal() {
    fields[numFields + 1] = <WebUiSearchSelectSingleField index={numFields + 1} />
    setFields(fields)
    setNumFields(numFields + 1)
  }

  function WebUiSearchSelectSingleField(singleFieldProps: { index: number }) {
    const [selected, setSelected] = useState<any | null>(null)

    function doSetSelected(selected) {
      setSelected(selected)
      vals[singleFieldProps.index] = selected
      setVals(vals)
      props.setValue(props.field.key, Object.values(vals))
    }

    return (
      <WebUiSelect
        document={props.field?.options?.document}
        indexType={props.field?.options?.indexType}
        input={props.field?.options?.input}
        selected={selected}
        setSelected={doSetSelected}
        displayValue={props.field?.options?.format}
        inputDisplayValue={props.field?.options?.format}
        placeholder={props.field?.options?.placeholder}
        defaultValue={props.field?.options?.format(props.field?.options?.defaultValue?.[singleFieldProps?.index])}
        zIndex={100 - singleFieldProps.index}
      />
    )
  }
  if (!fields) return null
  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <>
      <input
        hidden
        id={props.field.key}
        disabled={props.field?.options?.disabled}
        placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
        {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
      />
      {Object.keys(fields)?.map((key) => (
        <div key={key} className="mb-1 relative w-100 pb-1 h-10 ">
          <div className="  flex flex-row " style={{ width: '-webkit-fill-available' }}>
            <WebUiButton
              onClick={() => deleteVal(key)}
              icon={<TrashIcon className="ml-2 mr-2 mt-2 w-6 h-6 text-gray-500" />}
            />
            <div className="grow w-full ">{fields[key]}</div>
          </div>
        </div>
      ))}
      <div className="w-100 flex flex-row justify-end my-1">
        <WebUiButton onClick={addVal} type="primary">
          Add Trainer
          <PlusCircleIcon className="ml-2 w-5 h-5 text-white" />
        </WebUiButton>
      </div>
    </>
  )
}
