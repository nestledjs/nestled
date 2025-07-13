import React from 'react'
import clsx from 'clsx'
import { FormField, FormFieldType } from './form-types'
import { useFormContext } from './form-context'
import { useFormConfig } from './form-config-context'

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
import { ButtonField } from './fields/button-field'
import { DatePickerField } from './fields/datepicker-field'
import { DateTimePickerField } from './fields/datetimepicker-field'
import { TimePickerField } from './fields/timepicker-field'
import { SelectField } from './fields/select-field'
import { SelectFieldEnum } from './fields/select-field-enum'
import { SelectFieldMulti } from './fields/select-field-multi'
import { RadioField } from './fields/radio-field'
import { SelectFieldSearch } from './fields/select-field-search'
import { SelectFieldSearchApollo } from './fields/select-field-search-apollo'
import { SelectFieldMultiSearch } from './fields/select-field-multi-search'
import { SelectFieldMultiSearchApollo } from './fields/select-field-multi-search-apollo'
import { CustomField } from './fields/custom-field'
import { CustomCheckboxField } from './fields/custom-checkbox-field'
import { FormLabel } from './fields/label'

// This function remains internal to the renderer
function renderComponent(
  form: ReturnType<typeof useFormContext>,
  field: FormField,
  formReadOnly: boolean,
  formReadOnlyStyle: 'value' | 'disabled',
) {
  const hasError = !!form.formState.errors[field.key]

  switch (field.type) {
    case FormFieldType.Text:
      return (
        <TextField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.TextArea:
      return (
        <TextAreaField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Email:
      return (
        <EmailField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Password:
      return (
        <PasswordField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Url:
      return (
        <UrlField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Phone:
      return (
        <PhoneField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Number:
      return (
        <NumberField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Currency:
      return (
        <MoneyField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Select:
      return (
        <SelectField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.EnumSelect:
      return (
        <SelectFieldEnum
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.MultiSelect:
      return (
        <SelectFieldMulti
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Checkbox:
      return (
        <CheckboxField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Switch:
      return (
        <SwitchField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Button:
      return <ButtonField field={field} form={form} hasError={hasError} />
    case FormFieldType.DatePicker:
      return (
        <DatePickerField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.DateTimePicker:
      return (
        <DateTimePickerField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.TimePicker:
      return (
        <TimePickerField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.Radio:
      return (
        <RadioField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.SearchSelect:
      return (
        <SelectFieldSearch
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.SearchSelectApollo:
      return (
        <SelectFieldSearchApollo
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.SearchSelectMulti:
      return (
        <SelectFieldMultiSearch
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.SearchSelectMultiApollo:
      return (
        <SelectFieldMultiSearchApollo
          form={form}
          field={field}
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
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    case FormFieldType.CustomCheckbox:
      return (
        <CustomCheckboxField
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
      )
    default:
      return null
  }
}

/**
 * Renders a form field component based on the field definition.
 * This is the core function that enables declarative form field usage.
 *
 * Must be used within a Form component to access form context.
 * Automatically handles field rendering, validation display, and theming.
 *
 * @param field - The field definition object created using FormFieldClass methods
 * @param formReadOnly - Whether the field should be in read-only mode (overrides form-level setting)
 * @param formReadOnlyStyle - How to display read-only fields: 'value' shows plain text, 'disabled' shows disabled input
 * @param className - Additional CSS classes to apply to the field wrapper
 * @returns A React component that renders the appropriate field type with label, validation, and styling
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Field
 *   field={FormFieldClass.text('username', { label: 'Username', required: true })}
 * />
 *
 * // Multi-column layout with CSS Grid
 * <div className="grid grid-cols-2 gap-4">
 *   <Field
 *     field={FormFieldClass.text('firstName', { label: 'First Name' })}
 *     className="col-span-1"
 *   />
 *   <Field
 *     field={FormFieldClass.text('lastName', { label: 'Last Name' })}
 *     className="col-span-1"
 *   />
 * </div>
 *
 * // Using wrapperClassName in field options
 * <div className="grid grid-cols-2 gap-4">
 *   <Field
 *     field={FormFieldClass.text('firstName', {
 *       label: 'First Name',
 *       wrapperClassName: 'col-span-1'
 *     })}
 *   />
 *   <Field
 *     field={FormFieldClass.text('lastName', {
 *       label: 'Last Name',
 *       wrapperClassName: 'col-span-1'
 *     })}
 *   />
 * </div>
 *
 * // Horizontal layout within field
 * <Field
 *   field={FormFieldClass.checkbox('agree', {
 *     label: 'I agree to the terms',
 *     layout: 'horizontal'
 *   })}
 * />
 *
 * // Custom wrapper function
 * <Field
 *   field={FormFieldClass.text('email', {
 *     label: 'Email',
 *     customWrapper: (children) => (
 *       <div className="flex items-center space-x-4">
 *         {children}
 *       </div>
 *     )
 *   })}
 * />
 * ```
 */
export function Field({
  field,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
  className,
}: Readonly<{
  field: FormField
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
  className?: string
}>) {
  const form = useFormContext()
  const { labelDisplay } = useFormConfig()

  const error = form.formState.errors[field.key]
  const errorMessage = (error?.message as string) ?? (error ? 'This field is required' : null)

  // --- CONFIGURABLE LABEL LOGIC ---
  const hasLabelProp = !!field.options.label
  let showLabel = false

  if (hasLabelProp) {
    switch (labelDisplay) {
      case 'all':
        showLabel = true
        break
      case 'default':
      default:
        showLabel = field.type !== FormFieldType.Checkbox
        break
    }
  }

  const labelComponent = showLabel && (
    <FormLabel htmlFor={field.key} label={field.options.label ?? ''} required={field.options.required} />
  )

  const component = renderComponent(form, field, formReadOnly, formReadOnlyStyle)

  // --- RESPECT FIELD OPTIONS FOR LAYOUT ---
  const layout = field.options.layout || 'vertical'
  const customWrapper = field.options.customWrapper
  const wrapperClassName = field.options.wrapperClassName

  // Build the field content
  const fieldContent = (
    <>
      {layout === 'vertical' && labelComponent}
      <div className={clsx(layout === 'horizontal' && 'flex items-center space-x-3')}>
        {layout === 'horizontal' && labelComponent}
        <div className={clsx(layout === 'horizontal' && 'flex-1')}>
          {component}
          {error && <span className="text-red-700 text-sm">{errorMessage}</span>}
        </div>
      </div>
    </>
  )

  // If field has customWrapper, use it
  if (customWrapper) {
    return customWrapper(fieldContent)
  }

  // Standard wrapper with customizable classes
  return (
    <div key={field.key} className={clsx('space-y-1', wrapperClassName, className)}>
      {fieldContent}
    </div>
  )
}
