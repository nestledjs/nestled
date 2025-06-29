import {
  BaseFieldOptions,
  CheckboxOptions,
  ContentOptions,
  CurrencyFieldOptions,
  DatePickerOptions,
  EmailFieldOptions,
  EnumSelectOptions,
  FormField,
  FormFieldType,
  InputFieldOptions,
  NumberFieldOptions,
  PasswordFieldOptions,
  PhoneFieldOptions,
  SearchSelectOptions,
  SelectOptions,
  SwitchOptions,
  TextAreaOptions,
  UrlFieldOptions,
  CustomCheckboxOptions,
} from './form-types'

export class FormFieldClass {
  static field(type: FormFieldType, key: string, options: BaseFieldOptions = {}): FormField {
    return { type, key, options } as FormField
  }

  static input(key: string, options: InputFieldOptions = {}): FormField {
    return this.field(FormFieldType.Input, key, options)
  }

  static textArea(key: string, options: TextAreaOptions = {}): FormField {
    return this.field(FormFieldType.TextArea, key, options)
  }

  static email(key: string, options: EmailFieldOptions = {}): FormField {
    return this.field(FormFieldType.Email, key, options)
  }

  static password(key: string, options: PasswordFieldOptions = {}): FormField {
    return this.field(FormFieldType.Password, key, options)
  }

  static url(key: string, options: UrlFieldOptions = {}): FormField {
    return this.field(FormFieldType.Url, key, options)
  }

  static phone(key: string, options: PhoneFieldOptions = {}): FormField {
    return this.field(FormFieldType.Phone, key, options)
  }

  static number(key: string, options: NumberFieldOptions = {}): FormField {
    return this.field(FormFieldType.Number, key, options)
  }

  static currency(key: string, options: CurrencyFieldOptions = {}): FormField {
    return this.field(FormFieldType.Currency, key, options)
  }

  static checkbox(key: string, options: CheckboxOptions = {}): FormField {
    return this.field(FormFieldType.Checkbox, key, options)
  }

  static customCheckbox(key: string, options: CustomCheckboxOptions = {}): FormField {
    return this.field(FormFieldType.CustomCheckbox, key, options)
  }

  static switch(key: string, options: SwitchOptions = {}): FormField {
    return this.field(FormFieldType.Switch, key, options)
  }

  static datePicker(key: string, options: DatePickerOptions = {}): FormField {
    return this.field(FormFieldType.DatePicker, key, options)
  }

  static select(key: string, options: SelectOptions): FormField {
    return this.field(FormFieldType.Select, key, options)
  }

  static enumSelect(key: string, options: EnumSelectOptions): FormField {
    return this.field(FormFieldType.EnumSelect, key, options)
  }

  static searchSelect<TDataItem>(key: string, options: SearchSelectOptions<TDataItem>): FormField {
    return this.field(FormFieldType.SearchSelect, key, options)
  }

  static searchSelectMulti<TDataItem>(key: string, options: SearchSelectOptions<TDataItem>): FormField {
    return this.field(FormFieldType.SearchSelectMulti, key, options)
  }

  static content(key: string, options: ContentOptions): FormField {
    return this.field(FormFieldType.Content, key, options)
  }
}
