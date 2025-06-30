import { useEffect, useState } from 'react'
import { FormFieldProps, FormField, FormFieldType, RadioOption, RadioFormFieldOptions } from '../form-types'
import { Controller } from 'react-hook-form'
import { useFormTheme } from '../theme-context'
import clsx from 'clsx'

export function RadioField(
  props: FormFieldProps<Extract<FormField, { type: FormFieldType.Radio }>> & {
    formReadOnly?: boolean
    formReadOnlyStyle?: 'value' | 'disabled'
  },
) {
  const theme = useFormTheme()
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

  function getInputClassName(option: RadioOption, isChecked: boolean) {
    return clsx(
      theme.radioField.input,
      options?.fullWidthLabel && theme.radioField.inputFullWidth,
      isChecked && theme.radioField.inputChecked,
      (options?.hidden || option?.hidden) && 'opacity-0',
      options.radioDirection !== 'row' && 'ml-4',
      options?.disabled && theme.radioField.inputDisabled
    )
  }

  function renderReadOnly() {
    return (
      <>
        <div className="text-xs text-gray-500">{(options as any).helpText}</div>
        {readOnlyStyle === 'disabled' ? (
          <div className={clsx(
            theme.radioField.container,
            options.radioDirection !== 'row' ? theme.radioField.containerColumn : theme.radioField.containerRow
          )}>
            {options?.radioOptions?.map((option: RadioOption) => (
              <div key={option.key + '_container'} className={clsx(theme.radioField.radioContainer)}>
                <input
                  type="radio"
                  id={option.key}
                  name={props.field.key}
                  checked={option.value === value}
                  disabled={true}
                  required={options.required}
                  className={clsx(
                    theme.radioField.input, 
                    theme.radioField.inputDisabled,
                    option.value === value && theme.radioField.inputChecked
                  )}
                  readOnly
                />
                <label htmlFor={option.key} className={clsx(theme.radioField.label)}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        ) : selectedOption ? (
          <div className={clsx(theme.radioField.readOnlySelected)}>
            {theme.radioField.readOnlyIcon}
            <span className="pl-2">{selectedOption.label}</span>
          </div>
        ) : (
          <div className={clsx(theme.radioField.readOnlyUnselected)}>
            {theme.radioField.readOnlyUnselectedIcon}
          </div>
        )}
      </>
    )
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
      <>
        <div className="text-xs text-gray-500">{(options as any).helpText}</div>
        <Controller
          name={props.field.key}
          control={props.form.control}
          defaultValue={options?.defaultValue}
          render={({ field: { value, onChange } }) => (
            <div className={clsx(
              theme.radioField.container,
              options.radioDirection !== 'row' ? theme.radioField.containerColumn : theme.radioField.containerRow
            )}>
              {options?.radioOptions?.map((option: RadioOption) => (
                <div
                  key={option.key + '_container'}
                  className={clsx(
                    theme.radioField.optionContainer,
                    options?.fullWidthLabel && theme.radioField.optionContainerFullWidth,
                    option.checkedSubOption && 'grow',
                    options.radioDirection !== 'row' ? 'flex-col justify-center' : 'flex-row items-center'
                  )}
                >
                  <div
                    className={clsx(
                      'flex grow',
                      options.radioDirection !== 'row' ? 'flex-col justify-center' : 'flex-row items-center'
                    )}
                  >
                    <div className={clsx(
                      theme.radioField.radioContainer,
                      options.fancyStyle && theme.radioField.optionContainerFancy
                    )}>
                      {options?.fullWidthLabel ? (
                        <label htmlFor={option.key} className={clsx(theme.radioField.labelFullWidth)}>
                          {option.label}
                        </label>
                      ) : null}
                      <input
                        onChange={() => handleRadioChange(option, onChange)}
                        type="radio"
                        className={getInputClassName(option, option?.value === value)}
                        id={option.key}
                        name={props.field.key}
                        value={String(option.value ?? '')}
                        checked={option?.value === value}
                        disabled={options?.disabled}
                        required={options.required}
                      />
                      {!options?.fullWidthLabel ? (
                        <label
                          htmlFor={option.key}
                          className={clsx(
                            theme.radioField.label,
                            options.radioDirection !== 'row' ? theme.radioField.labelColumn : theme.radioField.labelRow
                          )}
                        >
                          {option.label}
                        </label>
                      ) : null}
                    </div>
                    {option?.value === value && option?.checkedSubOption ? (
                      <input
                        {...(option?.checkedSubOption?.key ? props.form.register(option.checkedSubOption.key) : {})}
                        name={option?.checkedSubOption?.key ?? ''}
                        placeholder={option?.checkedSubOption?.label ?? ''}
                        disabled={options?.disabled}
                        onChange={(e) => {
                          setSubOptionKey(option?.checkedSubOption?.key ?? '')
                          setSubOptionValue(e?.target?.value)
                          if (props.form.setValue) {
                            props.form.setValue(option?.checkedSubOption?.key ?? '', e?.target?.value)
                          }
                        }}
                        value={subOptionValue}
                        className={clsx(
                          theme.radioField.subOptionInput,
                          props.hasError && theme.radioField.subOptionError
                        )}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        />
      </>
    )
  }

  if (isReadOnly) {
    return renderReadOnly()
  }
  return renderEditable()
}
