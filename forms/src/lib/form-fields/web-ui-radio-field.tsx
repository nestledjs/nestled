import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { inputStyle, WebUiFormFieldProps } from '../web-ui-form'
import { RadioOption, WebUiRadioFormFieldOptions } from '../web-ui-form-fields'
import './web-ui-radio-field-style.css'

export function WebUiRadioField(props: WebUiFormFieldProps) {
  const [selectedOption, setSelectedOption] = useState<RadioOption>()
  const [subOptionKey, setSubOptionKey] = useState<string>()
  const [subOptionValue, setSubOptionValue] = useState<string>('')
  const options: WebUiRadioFormFieldOptions = props.field?.options
  useEffect(() => {
    if (options?.defaultValue !== undefined) {
      const defaultOption = options?.radioOptions?.find((o) => o.value === options?.defaultValue)

      if (props.setValue) {
        props.setValue(props.field.key, defaultOption?.value)
      }

      setSelectedOption(defaultOption)

      if (options?.defaultSubValue !== undefined) {
        if (defaultOption?.checkedSubOption) {
          setSubOptionKey(defaultOption?.checkedSubOption?.key)
          setSubOptionValue(options?.defaultSubValue)

          if (props.setValue) {
            props.setValue(defaultOption?.checkedSubOption?.key, options?.defaultSubValue)
          }
        }
      }
    }
  }, [options?.defaultValue, options?.defaultSubValue])

  function onRadioSelect(selected: RadioOption) {
    setSelectedOption(selected)

    if (props.setValue) {
      props.setValue(props.field.key, selected.value)

      if (selected?.checkedSubOption?.key) {
        props.setValue(selected?.checkedSubOption?.key, '')
        setSubOptionKey(selected.checkedSubOption?.key)
      } else if (subOptionKey) {
        props.setValue(subOptionKey, '')
        setSubOptionKey(null)
        setSubOptionValue('')
      }
    }
  }

  function checkedSubOptionChange(key: string, value: string) {
    setSubOptionKey(key)
    setSubOptionValue(value)
    if (props.setValue) {
      props.setValue(key, value)
    }
  }
  const children = []
  options?.radioOptions?.forEach((option) =>
    children.push(
      <div
        key={option.key + '_container'}
        className={`${options?.fullWidthLabel ? 'w-100  justify-between' : ''}
          ${option.checkedSubOption ? 'grow' : ''}
          ${options.radioDirection !== 'row' ? 'flex-col justify-center' : 'flex-row items-center'}
          flex 
        `}
      >
        <div
          className={`flex grow ${
            options.radioDirection !== 'row' ? 'flex-col justify-center' : 'flex-row items-center'
          }`}
        >
          <div className={`flex flex-row items-center ${options.fancyStyle ? 'border rounded-md' : ''}`}>
            {options?.fullWidthLabel ? (
              <label htmlFor={option.key} className="text-sm ml-2 grow">
                <span className="sr-only">{option.label.replace(/<[^>]+>/g, '')}</span>
                <div dangerouslySetInnerHTML={{ __html: option.label }} />
              </label>
            ) : null}

            <input
              onChange={() => onRadioSelect(option)}
              type="radio"
              className={`${options?.fullWidthLabel ? 'check' : ''} ${
                options?.hidden || option?.hidden ? 'opacity-0' : ''
              } ${options.radioDirection !== 'row' ? 'ml-4' : ''}`}
              id={option.key}
              name={props.field.key}
              value={option.value ?? ''}
              checked={option?.value === selectedOption?.value}
              disabled={options?.disabled}
            />
            {!options?.fullWidthLabel ? (
              <label
                htmlFor={option.key}
                className={`text-sm grow ${options.radioDirection !== 'row' ? 'p-4' : 'p-1 pl-2'}`}
              >
                <span className="sr-only">{option.label.replace(/<[^>]+>/g, '')}</span>
                <div dangerouslySetInnerHTML={{ __html: option.label }} />
              </label>
            ) : null}
          </div>

          {option?.value === selectedOption?.value && option?.checkedSubOption ? (
            <div
              key={option?.checkedSubOption?.key}
              className={`grow  ${options.radioDirection !== 'row' ? 'mt-4' : 'pl-4'}`}
            >
              {options?.radioDirection !== 'row' ? (
                <div className="text-sm grow mb-1">{option?.checkedSubOption?.label}</div>
              ) : null}
              <input
                {...props.register?.(option?.checkedSubOption?.key)}
                name={option?.checkedSubOption?.key}
                placeholder={options?.radioDirection === 'row' ? option?.checkedSubOption?.label : null}
                disabled={options?.disabled}
                onChange={(e) => checkedSubOptionChange(option?.checkedSubOption?.key, e?.target?.value)}
                value={subOptionValue}
                className={`grow ${inputStyle} ${props.hasError ? 'border-red-600 focus:border-red-600' : ''}`}
              />
            </div>
          ) : null}
        </div>
      </div>,
    ),
  )

  const RenderStaticField = () => {
    const val = options?.defaultValue
    if (val !== undefined) {
      return (
        <div className="flex flex-row">
          {val === true ? (
            <CheckIcon className="w-5 h-5 text-green_web" />
          ) : val === false ? (
            <XMarkIcon className="w-5 h-5 text-red-600" />
          ) : (
            options?.defaultValue?.toString()
          )}
          <div className="pl-5">{options?.defaultSubValue?.toString()}</div>
        </div>
      )
    } else {
      return null
    }
  }

  return props.renderStatic ? (
    RenderStaticField()
  ) : options?.customWrapper ? (
    options?.customWrapper(children)
  ) : (
    <div className={`flex w-full ${options.radioDirection !== 'row' ? 'flex-col gap-y-1' : 'flex-row gap-x-4'}`}>
      {children}
    </div>
  )
}
