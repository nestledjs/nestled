import { DocumentNode, TypedDocumentNode } from '@apollo/client'
import { JSX, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'

// The single enum for all field types, combining the best of both libraries
export enum FormFieldType {
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
  DateTimePicker = 'DateTimePicker',
  TimePicker = 'TimePicker',
  Select = 'Select',
  EnumSelect = 'EnumSelect',
  MultiSelect = 'MultiSelect',
  Radio = 'Radio',
  SearchSelect = 'SearchSelect',
  SearchSelectMulti = 'SearchSelectMulti',
  Content = 'Content',
  Custom = 'Custom',
}

// A Base interface for options common to ALL fields
export interface BaseFieldOptions {
  label?: string
  required?: boolean
  hidden?: boolean
  disabled?: boolean
  customWrapper?: (children: ReactNode) => JSX.Element
  layout?: 'horizontal' | 'vertical'
  defaultValue?: any
  /**
   * If true, this specific field will be in read-only mode, overriding the form-level prop.
   */
  readOnly?: boolean;
  /**
   * Determines how the field should appear when in read-only mode.
   * 'value': Renders the data as plain text. (Default)
   * 'disabled': Renders the UI component in a disabled state.
   */
  readOnlyStyle?: 'value' | 'disabled';
}

// Specific options interfaces that extend the base
export interface InputFieldOptions extends BaseFieldOptions {
  placeholder?: string
  validate?: (value: any) => string | boolean | Promise<string | boolean>
}
export type UrlFieldOptions = InputFieldOptions
export type EmailFieldOptions = InputFieldOptions
export type PasswordFieldOptions = InputFieldOptions
export type PhoneFieldOptions = InputFieldOptions
export type NumberFieldOptions = InputFieldOptions
export type CurrencyFieldOptions = InputFieldOptions

export interface TextAreaOptions extends BaseFieldOptions {
  placeholder?: string
  rows?: number
}

export interface CheckboxOptions extends BaseFieldOptions {
  defaultValue?: boolean
  labelTextSize?: string
  fullWidthLabel?: boolean
  wrapperClassNames?: string
}

export interface SwitchOptions extends BaseFieldOptions {
  defaultValue?: boolean
}

export interface DatePickerOptions extends BaseFieldOptions {
  defaultValue?: string // YYYY-MM-DD
  useController?: boolean
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

export interface SearchSelectOptions<TDataItem = any> extends BaseFieldOptions {
  document: DocumentNode | TypedDocumentNode
  dataType: string
  filter?: (items: TDataItem[]) => TDataItem[]
  selectOptionsFunction?: (items: TDataItem[]) => SearchSelectOption[]
}

export interface ContentOptions extends BaseFieldOptions {
  content: ReactNode
}

export interface CustomFieldRenderProps<T = unknown> {
  value: T
  onChange: (value: T) => void
  field: CustomFieldType<T>
}

export interface CustomFieldOptions<T = unknown> extends BaseFieldOptions {
  customField: (props: CustomFieldRenderProps<T>) => ReactNode
}

interface CustomFieldType<T = unknown> {
  key: string
  type: FormFieldType.Custom
  options: CustomFieldOptions<T>
}

// Specific interfaces for each complete field definition (discriminated union members)
interface InputField {
  key: string
  type: FormFieldType.Input
  options: InputFieldOptions
}
interface TextAreaField {
  key: string
  type: FormFieldType.TextArea
  options: TextAreaOptions
}
interface EmailField {
  key: string
  type: FormFieldType.Email
  options: EmailFieldOptions
}
interface PasswordField {
  key: string
  type: FormFieldType.Password
  options: PasswordFieldOptions
}
interface UrlField {
  key: string
  type: FormFieldType.Url
  options: UrlFieldOptions
}
interface PhoneField {
  key: string
  type: FormFieldType.Phone
  options: PhoneFieldOptions
}
interface NumberField {
  key: string
  type: FormFieldType.Number
  options: NumberFieldOptions
}
interface CurrencyField {
  key: string
  type: FormFieldType.Currency
  options: CurrencyFieldOptions
}
interface CheckboxField {
  key: string
  type: FormFieldType.Checkbox
  options: CheckboxOptions
}
interface SwitchField {
  key: string
  type: FormFieldType.Switch
  options: SwitchOptions
}
interface DatePickerField {
  key: string
  type: FormFieldType.DatePicker
  options: DatePickerOptions
}
interface SelectField {
  key: string
  type: FormFieldType.Select
  options: SelectOptions
}
interface EnumSelectField {
  key: string
  type: FormFieldType.EnumSelect
  options: EnumSelectOptions
}
interface SearchSelectField<TDataItem> {
  key: string
  type: FormFieldType.SearchSelect
  options: SearchSelectOptions<TDataItem>
}

interface SearchSelectMultiField<TDataItem> {
  key: string
  type: FormFieldType.SearchSelectMulti
  options: SearchSelectOptions<TDataItem>
}

interface ContentField {
  key: string
  type: FormFieldType.Content
  options: ContentOptions
}

// Add interfaces for new field types
interface MultiSelectField {
  key: string
  type: FormFieldType.MultiSelect
  options: SelectOptions
}
interface DateTimePickerField {
  key: string
  type: FormFieldType.DateTimePicker
  options: DatePickerOptions
}
interface TimePickerField {
  key: string
  type: FormFieldType.TimePicker
  options: BaseFieldOptions
}
interface RadioField {
  key: string
  type: FormFieldType.Radio
  options: RadioFormFieldOptions
}

export interface RadioOption {
  key: string;
  value: string | number | boolean;
  label: string;
  checkedSubOption?: {
    key: string;
    label: string;
  };
  hidden?: boolean;
}

export interface RadioFormFieldOptions extends BaseFieldOptions {
  radioOptions: RadioOption[];
  defaultValue?: string | number | boolean;
  defaultSubValue?: string;
  fullWidthLabel?: boolean;
  radioDirection?: 'row' | 'column';
  customWrapper?: (children: React.ReactNode) => JSX.Element;
  fancyStyle?: boolean;
  hidden?: boolean;
  disabled?: boolean;
}

// The final FormField is a union of all possible field shapes
export type FormField =
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
  | DateTimePickerField
  | TimePickerField
  | SelectField
  | EnumSelectField
  | MultiSelectField
  | RadioField
  | SearchSelectField<any>
  | SearchSelectMultiField<any>
  | ContentField
  | CustomFieldType<any>

// A generic prop type for all individual field components
export interface FormFieldProps<T extends FormField> {
  field: T
  form: UseFormReturn
  hasError: boolean
}
