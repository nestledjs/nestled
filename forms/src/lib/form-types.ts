import { DocumentNode, TypedDocumentNode } from '@apollo/client'
import { JSX, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'

// The single enum for all field types, combining the best of both libraries
export enum FormFieldType {
  Text = 'Text',
  TextArea = 'TextArea',
  Email = 'Email',
  Password = 'Password',
  Url = 'Url',
  Phone = 'Phone',
  Number = 'Number',
  Currency = 'Currency',
  Checkbox = 'Checkbox',
  Switch = 'Switch',
  Button = 'Button',
  DatePicker = 'DatePicker',
  DateTimePicker = 'DateTimePicker',
  TimePicker = 'TimePicker',
  Select = 'Select',
  EnumSelect = 'EnumSelect',
  MultiSelect = 'MultiSelect',
  Radio = 'Radio',
  CheckboxGroup = 'CheckboxGroup',
  SearchSelect = 'SearchSelect',
  SearchSelectApollo = 'SearchSelectApollo',
  SearchSelectMulti = 'SearchSelectMulti',
  SearchSelectMultiApollo = 'SearchSelectMultiApollo',
  Content = 'Content',
  Custom = 'Custom',
  CustomCheckbox = 'CustomCheckbox',
  MarkdownEditor = 'MarkdownEditor',
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
  readOnly?: boolean
  /**
   * Determines how the field should appear when in read-only mode.
   * 'value': Renders the data as plain text. (Default)
   * 'disabled': Renders the UI component in a disabled state.
   */
  readOnlyStyle?: 'value' | 'disabled'
  helpText?: string
  /**
   * Additional CSS classes to apply to the field wrapper.
   * Useful for layout customization (e.g., grid positioning, flexbox, spacing).
   */
  wrapperClassName?: string
  /**
   * Optional transformation function to convert field value from display format to submission format.
   * This is useful for fields that store rich objects internally but need to submit simple values.
   * For example, multi-select fields that display option objects but submit ID arrays.
   */
  submitTransform?: (displayValue: unknown) => unknown
  
  // Conditional logic properties
  /**
   * Function that determines if this field should be visible based on current form values.
   * If this returns false, the field will not be rendered at all.
   * 
   * @param formValues - Current values of all form fields
   * @returns true if field should be shown, false if it should be hidden
   * 
   * @example
   * ```tsx
   * FormFieldClass.text('email', {
   *   label: 'Email Address',
   *   showWhen: (values) => values.contactMethod === 'email'
   * })
   * ```
   */
  showWhen?: (formValues: any) => boolean
  
  /**
   * Function that determines if this field should be required based on current form values.
   * This dynamically overrides the static 'required' property.
   * 
   * @param formValues - Current values of all form fields  
   * @returns true if field should be required, false otherwise
   * 
   * @example
   * ```tsx
   * FormFieldClass.text('companyName', {
   *   label: 'Company Name',
   *   requiredWhen: (values) => values.accountType === 'business'
   * })
   * ```
   */
  requiredWhen?: (formValues: any) => boolean
  
  /**
   * Function that determines if this field should be disabled based on current form values.
   * This dynamically overrides the static 'disabled' property.
   * 
   * @param formValues - Current values of all form fields
   * @returns true if field should be disabled, false otherwise
   * 
   * @example
   * ```tsx
   * FormFieldClass.text('personalEmail', {
   *   label: 'Personal Email',
   *   disabledWhen: (values) => values.useCompanyEmail === true
   * })
   * ```
   */
  disabledWhen?: (formValues: any) => boolean
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
export interface NumberFieldOptions extends InputFieldOptions {
  min?: number
  max?: number
  step?: number
}

// Enhanced currency support
export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CNY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'HRK'
  | 'RUB'
  | 'TRY'
  | 'BRL'
  | 'MXN'
  | 'INR'
  | 'KRW'
  | 'SGD'
  | 'HKD'
  | 'NZD'
  | 'ZAR'
  | 'THB'
  | 'MYR'
  | 'IDR'
  | 'PHP'
  | 'VND'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  name: string
  symbolPosition: 'before' | 'after'
  decimalPlaces: number
  thousandsSeparator: string
  decimalSeparator: string
}

export interface CurrencyFieldOptions extends InputFieldOptions {
  currency?: CurrencyCode | 'custom'
  customCurrency?: Partial<CurrencyConfig>
  showCurrencyCode?: boolean // Show "USD" alongside symbol
  hideSymbolWhenEmpty?: boolean // Default: true
}

export interface TextAreaOptions extends BaseFieldOptions {
  placeholder?: string
  rows?: number
}

export interface CheckboxOptions extends BaseFieldOptions {
  defaultValue?: boolean
  labelTextSize?: string
  fullWidthLabel?: boolean
  wrapperClassNames?: string
  helpText?: string
  errorText?: string
  indeterminate?: boolean
}

export interface SwitchOptions extends BaseFieldOptions {
  defaultValue?: boolean
}

export interface ButtonOptions extends BaseFieldOptions {
  text?: string
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  onClick?: () => void | Promise<void>
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  className?: string
}

export interface DatePickerOptions extends BaseFieldOptions {
  defaultValue?: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm for datetime
  useController?: boolean
  min?: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm for datetime
  max?: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm for datetime
  placeholder?: string
  step?: number // For datetime inputs, step in seconds
}

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectOptions extends BaseFieldOptions {
  options: SelectOption[]
  placeholder?: string
}

export interface EnumSelectOptions extends BaseFieldOptions {
  enum: { [s: string]: unknown } | ArrayLike<unknown>
}

export interface SearchSelectOption {
  label: string
  value: string
}

export interface SearchSelectOptions extends BaseFieldOptions {
  options: SearchSelectOption[]
  placeholder?: string
  // Server-side search capabilities
  onSearchChange?: (search: string) => void
  loading?: boolean
  searchDebounceMs?: number
}

export interface SearchSelectApolloOptions<TDataItem = any> extends BaseFieldOptions {
  document: DocumentNode | TypedDocumentNode
  dataType: string
  searchFields?: string[]
  filter?: (items: TDataItem[]) => TDataItem[]
  selectOptionsFunction?: (items: TDataItem[]) => SearchSelectOption[]
  /**
   * Initial options to display before Apollo data loads.
   * Useful for showing pre-selected values with proper labels,
   * especially when the selected item might not be in the first page of results.
   */
  initialOptions?: SearchSelectOption[]
}

export interface SearchSelectMultiOptions extends BaseFieldOptions {
  options: SearchSelectOption[]
  placeholder?: string
  // Server-side search capabilities
  onSearchChange?: (search: string) => void
  loading?: boolean
  searchDebounceMs?: number
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
  type: FormFieldType.Text
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
interface ButtonField {
  key: string
  type: FormFieldType.Button
  options: ButtonOptions
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
interface SearchSelectField {
  key: string
  type: FormFieldType.SearchSelect
  options: SearchSelectOptions
}

interface SearchSelectApolloField<TDataItem> {
  key: string
  type: FormFieldType.SearchSelectApollo
  options: SearchSelectApolloOptions<TDataItem>
}

interface SearchSelectMultiApolloField<TDataItem> {
  key: string
  type: FormFieldType.SearchSelectMultiApollo
  options: SearchSelectApolloOptions<TDataItem>
}

interface SearchSelectMultiField {
  key: string
  type: FormFieldType.SearchSelectMulti
  options: SearchSelectMultiOptions
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
interface CheckboxGroupField {
  key: string
  type: FormFieldType.CheckboxGroup
  options: CheckboxGroupOptions
}

export interface RadioOption {
  key: string
  value: string | number | boolean
  label: string
  checkedSubOption?: {
    key: string
    label: string
  }
  hidden?: boolean
}

export interface RadioFormFieldOptions extends BaseFieldOptions {
  radioOptions: RadioOption[]
  defaultValue?: string | number | boolean
  defaultSubValue?: string
  fullWidthLabel?: boolean
  radioDirection?: 'row' | 'column'
  customWrapper?: (children: React.ReactNode) => JSX.Element
  fancyStyle?: boolean
  hidden?: boolean
  disabled?: boolean
}

export interface CheckboxGroupOption {
  key: string
  value: string | number
  label: string
  hidden?: boolean
}

export interface CheckboxGroupOptions extends BaseFieldOptions {
  checkboxOptions: CheckboxGroupOption[]
  defaultValue?: string // comma-separated string of selected values
  fullWidthLabel?: boolean
  checkboxDirection?: 'row' | 'column'
  customWrapper?: (children: React.ReactNode) => JSX.Element
  fancyStyle?: boolean
  // Separator for storing multiple values (default: comma)
  valueSeparator?: string
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
  | ButtonField
  | DatePickerField
  | DateTimePickerField
  | TimePickerField
  | SelectField
  | EnumSelectField
  | MultiSelectField
  | RadioField
  | CheckboxGroupField
  | SearchSelectField
  | SearchSelectApolloField<any>
  | SearchSelectMultiField
  | SearchSelectMultiApolloField<any>
  | ContentField
  | CustomFieldType<any>
  | CustomCheckboxField
  | MarkdownEditorField

// A generic prop type for all individual field components
export interface FormFieldProps<T extends FormField> {
  field: T
  form: UseFormReturn
  hasError: boolean
}

export interface CustomCheckboxOptions extends BaseFieldOptions {
  defaultValue?: boolean
  fullWidthLabel?: boolean
  wrapperClassNames?: string
  helpText?: string
  errorText?: string
  checkedIcon?: ReactNode
  uncheckedIcon?: ReactNode
  readonlyCheckedIcon?: ReactNode
  readonlyUncheckedIcon?: ReactNode
}

interface CustomCheckboxField {
  key: string
  type: FormFieldType.CustomCheckbox
  options: CustomCheckboxOptions
}

export interface MarkdownEditorOptions extends BaseFieldOptions {
  placeholder?: string
  height?: number
  maxLength?: number
  readOnly?: boolean
  readOnlyStyle?: 'value' | 'disabled'
  disabled?: boolean
  helpText?: string
  defaultValue?: string
  required?: boolean
  
  // Image upload configuration
  enableImageUpload?: boolean
  imageUploadHandler?: (file: File) => Promise<string>
  maxImageSize?: number // in bytes
  allowedImageTypes?: string[] // ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  imageUploadMode?: 'immediate' | 'base64' | 'custom'
  imageUploadPlaceholder?: string
  
  // Dual format output configuration
  outputFormat?: 'markdown' | 'html' | 'both' // New option for output format
  onHtmlChange?: (html: string) => void // Callback for HTML content
  
  // Modal/Dialog configuration
  overlayContainer?: HTMLElement | null // Custom container for editor popups (fixes modal-on-modal conflicts)
  popupZIndex?: number // Custom z-index for popups
}

interface MarkdownEditorField {
  key: string
  type: FormFieldType.MarkdownEditor
  options: MarkdownEditorOptions
}
