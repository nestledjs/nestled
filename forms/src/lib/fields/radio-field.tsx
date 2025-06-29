import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { FormFieldProps, FormField, FormFieldType, RadioOption, RadioFormFieldOptions } from '../form-types'

import './radio-field-style.css'
import { Controller } from 'react-hook-form'

export function RadioField(
  props: FormFieldProps<Extract<FormField, { type: FormFieldType.Radio }>> & {
    formReadOnly?: boolean
    formReadOnlyStyle?: 'value' | 'disabled'
  },
) {
  const [subOptionKey, setSubOptionKey] = useState<string>()
  const [subOptionValue, setSubOptionValue] = useState<string>('')
  const options: RadioFormFieldOptions = props.field?.options

  useEffect(() => {
    if (options?.defaultValue !== undefined) {
      const defaultOption = options?.radioOptions?.find((o: RadioOption) => o.value === options?.defaultValue)
      if (props.form.setValue) {
        props.form.setValue(props.field.key, defaultOption?.value)
      }
      if (options?.defaultSubValue !== undefined && defaultOption?.checkedSubOption) {
        setSubOptionKey(defaultOption?.checkedSubOption?.key)
        setSubOptionValue(options?.defaultSubValue)
        if (props.form.setValue) {
          props.form.setValue(defaultOption?.checkedSubOption?.key, options?.defaultSubValue)
        }
      }
    }
  }, [
    options?.defaultValue,
    options?.defaultSubValue,
    props.form.setValue,
    props.field.key,
    options,
    options.radioOptions,
    props.form,
    props.field,
  ])

  const isReadOnly = options.readOnly ?? props.formReadOnly
  const readOnlyStyle = options.readOnlyStyle ?? props.formReadOnlyStyle
  const value = props.form.getValues(props.field.key)
  const selectedOption = options.radioOptions?.find((o) => o.value === value)

  function getInputClassName(option: RadioOption) {
    return [
      options?.fullWidthLabel ? 'check' : '',
      options?.hidden || option?.hidden ? 'opacity-0' : '',
      options.radioDirection !== 'row' ? 'ml-4' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  function renderReadOnly() {
    if (readOnlyStyle === 'disabled') {
      return (
        <div className={`flex w-full ${options.radioDirection !== 'row' ? 'flex-col gap-y-1' : 'flex-row gap-x-4'}`}>
          {options?.radioOptions?.map((option: RadioOption) => (
            <div key={option.key + '_container'} className="flex flex-row items-center">
              <input
                type="radio"
                id={option.key}
                name={props.field.key}
                checked={option.value === value}
                disabled={true}
                className={inputStyle}
                readOnly
              />
              <label htmlFor={option.key} className="text-sm ml-2 grow">
                <span className="sr-only">{option.label}</span>
                {option.label}
              </label>
            </div>
          ))}
        </div>
      )
    }
    if (selectedOption) {
      return (
        <div className="flex flex-row items-center">
          <CheckIcon className="w-5 h-5 text-green_web" />
          <span className="pl-2">{selectedOption.label}</span>
        </div>
      )
    }
    return <XMarkIcon className="w-5 h-5 text-red-600" />
  }

  function handleRadioChange(option: RadioOption, onChange: (value: any) => void) {
    onChange(option.value)
    if (option?.checkedSubOption?.key) {
      setSubOptionKey(option.checkedSubOption.key)
      setSubOptionValue('')
      if (props.form.setValue) {
        props.form.setValue(option.checkedSubOption.key, '')
      }
    } else if (subOptionKey) {
      setSubOptionKey(undefined)
      setSubOptionValue('')
      if (props.form.setValue) {
        props.form.setValue(subOptionKey, '')
      }
    }
  }

  function renderEditable() {
    return (
      <Controller
        name={props.field.key}
        control={props.form.control}
        defaultValue={options?.defaultValue}
        render={({ field: { value, onChange } }) => (
          <div className={`flex w-full ${options.radioDirection !== 'row' ? 'flex-col gap-y-1' : 'flex-row gap-x-4'}`}>
            {options?.radioOptions?.map((option: RadioOption) => (
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
                        <span className="sr-only">{option.label}</span>
                        {option.label}
                      </label>
                    ) : null}
                    <input
                      onChange={() => handleRadioChange(option, onChange)}
                      type="radio"
                      className={getInputClassName(option)}
                      id={option.key}
                      name={props.field.key}
                      value={String(option.value ?? '')}
                      checked={option?.value === value}
                      disabled={options?.disabled}
                    />
                    {!options?.fullWidthLabel ? (
                      <label
                        htmlFor={option.key}
                        className={`text-sm grow ${options.radioDirection !== 'row' ? 'p-4' : 'p-1 pl-2'}`}
                      >
                        <span className="sr-only">{option.label}</span>
                        {option.label}
                      </label>
                    ) : null}
                  </div>
                  {option?.value === value && option?.checkedSubOption ? (
                    <input
                      {...(option?.checkedSubOption?.key ? props.form.register(option.checkedSubOption.key) : {})}
                      name={option?.checkedSubOption?.key ?? ''}
                      placeholder={
                        options?.radioDirection === 'row' ? option?.checkedSubOption?.label ?? '' : undefined
                      }
                      disabled={options?.disabled}
                      onChange={(e) => {
                        setSubOptionKey(option?.checkedSubOption?.key ?? '')
                        setSubOptionValue(e?.target?.value)
                        if (props.form.setValue) {
                          props.form.setValue(option?.checkedSubOption?.key ?? '', e?.target?.value)
                        }
                      }}
                      value={subOptionValue}
                      className={`grow ${inputStyle} ${props.hasError ? 'border-red-600 focus:border-red-600' : ''}`}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      />
    )
  }

  if (isReadOnly) {
    return renderReadOnly()
  }
  return renderEditable()
}
