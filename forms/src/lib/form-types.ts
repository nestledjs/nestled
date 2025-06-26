// /src/lib/web-ui-form-types.ts
import { DocumentNode, TypedDocumentNode } from '@apollo/client'
import { ReactNode } from 'react'
import { Control, FieldErrors, UseFormReturn } from 'react-hook-form'

// The single enum for all field types, combining the best of both libraries
export enum WebUiFormFieldType {
  Input = 'Input',
  TextArea = 'TextArea',
  Email = 'Email',
  Password = 'Password',
  Url = 'Url',
  Phone = 'Phone',
  Number = 'Number',
  Currency = 'Currency',
  Checkbox = 'Checkbox',
  Switch = 'Switch',
  DatePicker = 'DatePicker',
  Select = 'Select',
  EnumSelect = 'EnumSelect',
  SearchSelect = 'SearchSelect',
  SearchSelectMulti = 'SearchSelectMulti',
  Content = 'Content',
}

// 1. A Base interface for options common to ALL fields
export interface BaseFieldOptions {
  label?: string
  required?: boolean
  hidden?: boolean
  disabled?: boolean
  customWrapper?: (children: ReactNode) => JSX.Element
  layout?: 'horizontal' | 'vertical'
  defaultValue?: any
}

// 2. Specific options interfaces that extend the base
export interface InputFieldOptions extends BaseFieldOptions {
  placeholder?: string
}
export interface UrlFieldOptions extends InputFieldOptions {}
export interface EmailFieldOptions extends InputFieldOptions {}
export interface PasswordFieldOptions extends InputFieldOptions {}
export interface PhoneFieldOptions extends InputFieldOptions {}
export interface NumberFieldOptions extends InputFieldOptions {}
export interface CurrencyFieldOptions extends InputFieldOptions {}

export interface TextAreaOptions extends BaseFieldOptions {
  placeholder?: string
  rows?: number
}

export interface CheckboxOptions extends BaseFieldOptions {
  defaultValue?: boolean
  labelTextSize?: string
}

export interface SwitchOptions extends BaseFieldOptions {
  defaultValue?: boolean
}

export interface DatePickerOptions extends BaseFieldOptions {
  defaultValue?: string // YYYY-MM-DD
}

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectOptions extends BaseFieldOptions {
  options: SelectOption[]
}

export interface EnumSelectOptions extends BaseFieldOptions {
  enum: { [s: string]: unknown } | ArrayLike<unknown>
}

export interface SearchSelectOption {
  label: string
  value: string
}

export interface SearchSelectOptions extends BaseFieldOptions {
  document: DocumentNode | TypedDocumentNode
  dataType: string
  filter?: (items: any[]) => any[]
  selectOptionsFunction?: (items: any[]) => SearchSelectOption[]
}

export interface ContentOptions extends BaseFieldOptions {
  content: ReactNode
}

// 3. Specific interfaces for each complete field definition (the discriminated union members)
interface InputField {
  key: string
  type: WebUiFormFieldType.Input
  options: InputFieldOptions
}
interface TextAreaField {
  key: string
  type: WebUiFormFieldType.TextArea
  options: TextAreaOptions
}
interface EmailField {
  key: string
  type: WebUiFormFieldType.Email
  options: EmailFieldOptions
}
interface PasswordField {
  key: string
  type: WebUiFormFieldType.Password
  options: PasswordFieldOptions
}
interface UrlField {
  key: string
  type: WebUiFormFieldType.Url
  options: UrlFieldOptions
}
interface PhoneField {
  key: string
  type: WebUiFormFieldType.Phone
  options: PhoneFieldOptions
}
interface NumberField {
  key: string
  type: WebUiFormFieldType.Number
  options: NumberFieldOptions
}
interface CurrencyField {
  key: string
  type: WebUiFormFieldType.Currency
  options: CurrencyFieldOptions
}
interface CheckboxField {
  key: string
  type: WebUiFormFieldType.Checkbox
  options: CheckboxOptions
}
interface SwitchField {
  key: string
  type: WebUiFormFieldType.Switch
  options: SwitchOptions
}
interface DatePickerField {
  key: string
  type: WebUiFormFieldType.DatePicker
  options: DatePickerOptions
}
interface SelectField {
  key: string
  type: WebUiFormFieldType.Select
  options: SelectOptions
}
interface EnumSelectField {
  key: string
  type: WebUiFormFieldType.EnumSelect
  options: EnumSelectOptions
}
interface SearchSelectField {
  key: string
  type: WebUiFormFieldType.SearchSelect
  options: SearchSelectOptions
}
interface SearchSelectMultiField {
  key: string
  type: WebUiFormFieldType.SearchSelectMulti
  options: SearchSelectOptions // Multi-select uses the same options
}
interface ContentField {
  key: string
  type: WebUiFormFieldType.Content
  options: ContentOptions
}

// 4. The final WebUiFormField is a union of all possible field shapes
export type WebUiFormField =
  | InputField
  | TextAreaField
  | EmailField
  | PasswordField
  | UrlField
  | PhoneField
  | NumberField
  | CurrencyField
  | CheckboxField
  | SwitchField
  | DatePickerField
  | SelectField
  | EnumSelectField
  | SearchSelectField
  | SearchSelectMultiField
  | ContentField

// 5. A generic prop type for all individual field components
export interface WebUiFormFieldProps<T extends WebUiFormField> {
  field: T
  form: UseFormReturn
  hasError: boolean
}
