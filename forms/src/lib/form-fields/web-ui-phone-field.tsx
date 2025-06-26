import 'react-phone-number-input/style.css'
import './web-ui-phone-field.css'

import { useEffect, useState } from 'react'
import { isPossiblePhoneNumber } from 'react-phone-number-input'
import { WebUiFormFieldProps } from '../web-ui-form'

export function WebUiPhoneField(props: WebUiFormFieldProps) {
  const [value, setValue] = useState<string>(props.field?.options?.defaultValue?.toString() ?? '')

  useEffect(() => {
    setValue(props.field?.options?.defaultValue?.toString())
  }, [props.field?.options?.defaultValue])

  function validatePhone(val) {
    return val === undefined || val === '' || isPossiblePhoneNumber((val ?? '')?.toString(), 'US')
  }

  return props.renderStatic ? (
    props.field?.options?.defaultValue?.toString()
  ) : (
    <>
      <input
        id={props.field.key}
        type="tel"
        disabled={props.field?.options?.disabled}
        placeholder={props.field?.options?.placeholderLabel ? props.field?.options?.label : null}
        defaultValue={props.field?.options?.defaultValue}
        {...props.register(`${props.field.key}`, {
          validate: (v) => validatePhone(v),
        })}
        // className={inputStyle}
      />
      {props.errors[props.field.key] && props.errors[props.field.key].type === 'validate' && (
        <div className={` text-2xs sm:text-sm mt-2 mx-1 text-red-700`}>* Phone number is invalid</div>
      )}
    </>
  )
}
