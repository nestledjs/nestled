import React from 'react'
import clsx from 'clsx'
import { FormField, FormFieldType } from './form-types'
import { useFormContext } from './form-context'

import { TextField } from './fields/text-field'
import { TextAreaField } from './fields/textarea-field'
import { EmailField } from './fields/email-field'
import { PasswordField } from './fields/password-field'
import { UrlField } from './fields/url-field'
import { PhoneField } from './fields/phone-field'
import { NumberField } from './fields/number-field'
import { MoneyField } from './fields/money-field'
import { CheckboxField } from './fields/checkbox-field'
import { SwitchField } from './fields/switch-field'
import { DatePickerField } from './fields/datepicker-field'
import { DateTimePickerField } from './fields/datetimepicker-field'
import { TimePickerField } from './fields/timepicker-field'
import { SelectField } from './fields/select-field'
import { MultiSelectField } from './fields/multiselect-field'
import { RadioField } from './fields/radio-field'
import { SearchSelectField } from './fields/search-select-field'
import { SearchSelectMultiField } from './fields/search-select-multi-field'
import { CustomField } from './fields/custom-field'

// This function remains internal to the renderer
function renderComponent(form: ReturnType<typeof useFormContext>, field: FormField, formReadOnly: boolean, formReadOnlyStyle: 'value' | 'disabled') {
  const hasError = !!form.formState.errors[field.key]

  switch (field.type) {
    case FormFieldType.Input:
      return (
        <TextField form={form} field={field as Extract<FormField, { type: FormFieldType.Input }>} hasError={hasError} formReadOnly={formReadOnly} formReadOnlyStyle={formReadOnlyStyle} />
      )
    case FormFieldType.TextArea:
      return (
        <TextAreaField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.TextArea }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Email:
      return (
        <EmailField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Email }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Password:
      return (
        <PasswordField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Password }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Url:
      return (
        <UrlField form={form} field={field as Extract<FormField, { type: FormFieldType.Url }>} hasError={hasError} formReadOnly={formReadOnly} formReadOnlyStyle={formReadOnlyStyle} />
      )
    case FormFieldType.Phone:
      return (
        <PhoneField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Phone }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Number:
      return (
        <NumberField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Number }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Currency:
      return (
        <MoneyField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Currency }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Select:
    case FormFieldType.EnumSelect:
      return (
        <SelectField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Select } | { type: FormFieldType.EnumSelect }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.MultiSelect:
      return (
        <MultiSelectField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.MultiSelect }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Checkbox:
      return (
        <CheckboxField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Checkbox }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Switch:
      return (
        <SwitchField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Switch }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.DatePicker:
      return (
        <DatePickerField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.DatePicker }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.DateTimePicker:
      return (
        <DateTimePickerField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.DateTimePicker }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.TimePicker:
      return (
        <TimePickerField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.TimePicker }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Radio:
      return (
        <RadioField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Radio }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.SearchSelect:
      return (
        <SearchSelectField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.SearchSelect }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.SearchSelectMulti:
      return (
        <SearchSelectMultiField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.SearchSelectMulti }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Content:
      return field.options.content
    case FormFieldType.Custom:
      return (
        <CustomField
          form={form}
          field={field as Extract<FormField, { type: FormFieldType.Custom }>}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    default:
      return null
  }
}

// This is the exported component you will use
export function RenderFormField({ field, formReadOnly = false, formReadOnlyStyle = 'value' }: { field: FormField, formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const form = useFormContext() // Get the form context here

  const error = form.formState.errors[field.key]
  const errorMessage = (error?.message as string) ?? (error ? 'This field is required' : null)

  // Only render the generic label for non-checkbox fields
  const isCheckbox = field.type === FormFieldType.Checkbox;
  const label = !isCheckbox && field.options.label && (
    <label htmlFor={field.key} className={clsx()}>
      {field.options.label}
    </label>
  )

  const component = renderComponent(form, field, formReadOnly, formReadOnlyStyle)

  return (
    <div key={field.key} className={clsx()}>
      {label}
      <div className={clsx()}>
        {component}
        {error && <span className="text-red-700 text-sm">{errorMessage}</span>}
      </div>
    </div>
  )
}
