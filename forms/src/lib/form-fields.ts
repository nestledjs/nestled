import {
  BaseFieldOptions,
  ButtonOptions,
  CheckboxOptions,
  ContentOptions,
  CurrencyFieldOptions,
  CustomCheckboxOptions,
  CustomFieldOptions,
  DatePickerOptions,
  EmailFieldOptions,
  EnumSelectOptions,
  FormField,
  FormFieldType,
  InputFieldOptions,
  MarkdownEditorOptions,
  NumberFieldOptions,
  PasswordFieldOptions,
  PhoneFieldOptions,
  SearchSelectOptions,
  SearchSelectApolloOptions,
  SearchSelectMultiOptions,
  SelectOptions,
  SwitchOptions,
  TextAreaOptions,
  UrlFieldOptions,
} from './form-types'

/**
 * Factory class for creating form field definitions.
 * Provides a fluent API for building strongly-typed form fields.
 * 
 * This is the main imperative API for creating form fields that can be used
 * with both declarative (`fields` prop) and imperative (`children`) patterns.
 * 
 * @example
 * ```tsx
 * // Basic field creation
 * const usernameField = FormFieldClass.text('username', { 
 *   label: 'Username', 
 *   required: true,
 *   placeholder: 'Enter your username'
 * })
 * 
 * // Complex field with validation
 * const emailField = FormFieldClass.email('email', {
 *   label: 'Email Address',
 *   required: true,
 *   validate: (value) => {
 *     if (!value.includes('@')) return 'Please enter a valid email'
 *     return true
 *   }
 * })
 * 
 * // Custom field with advanced options
 * const phoneField = FormFieldClass.phone('phone', {
 *   label: 'Phone Number',
 *   helpText: 'Include country code',
 *   readOnly: false,
 *   readOnlyStyle: 'disabled'
 * })
 * ```
 */
export class FormFieldClass {
  /**
   * Creates a generic form field. Usually you'll want to use specific methods like text(), email(), etc.
   * 
   * @param type - The field type from FormFieldType enum
   * @param key - Unique identifier for the field (used as form field name)
   * @param options - Configuration options for the field
   * @returns A FormField object that can be used with Form component
   */
  static field(type: FormFieldType, key: string, options: BaseFieldOptions = {}): FormField {
    return { type, key, options } as FormField
  }

  /**
   * Creates a text input field.
   * 
   * @param key - Unique identifier for the field
   * @param options - Configuration options including label, placeholder, validation, etc.
   * @returns A text field definition
   * 
   * @example
   * ```tsx
   * FormFieldClass.text('firstName', { 
   *   label: 'First Name', 
   *   required: true,
   *   placeholder: 'Enter your first name'
   * })
   * ```
   */
  static text(key: string, options: InputFieldOptions = {}): FormField {
    return this.field(FormFieldType.Text, key, options)
  }

  /**
   * Creates a textarea field for multi-line text input.
   * 
   * @param key - Unique identifier for the field
   * @param options - Configuration options including label, placeholder, rows, etc.
   * @returns A textarea field definition
   * 
   * @example
   * ```tsx
   * FormFieldClass.textArea('description', { 
   *   label: 'Description', 
   *   placeholder: 'Enter a detailed description',
   *   rows: 4
   * })
   * ```
   */
  static textArea(key: string, options: TextAreaOptions = {}): FormField {
    return this.field(FormFieldType.TextArea, key, options)
  }

  /**
   * Creates a markdown editor field with rich text editing capabilities.
   * 
   * @param key - Unique identifier for the field
   * @param options - Configuration options including label, height, preview, toolbar, etc.
   * @returns A markdown editor field definition
   * 
   * @example
   * ```tsx
   * FormFieldClass.markdownEditor('content', { 
   *   label: 'Content', 
   *   height: 400,
   *   preview: true,
   *   toolbar: ['bold', 'italic', 'link', 'quote', 'code']
   * })
   * ```
   * 
   * @example Dual format output
   * ```tsx
   * FormFieldClass.markdownEditor('content', { 
   *   label: 'Content',
   *   outputFormat: 'both', // Outputs both markdown and HTML
   *   onHtmlChange: (html) => console.log('HTML:', html)
   * })
   * ```
   * 
   * @example Modal-on-modal fix
   * ```tsx
   * FormFieldClass.markdownEditor('content', { 
   *   label: 'Content',
   *   // Fix for when MarkdownEditor is inside a modal
   *   overlayContainer: document.getElementById('modal-container'),
   *   popupZIndex: 10000, // Higher than your modal's z-index
   * })
   * ```
   */
  static markdownEditor(
    key: string,
    options: Partial<MarkdownEditorOptions> = {}
  ): FormField {
    return {
      key,
      type: FormFieldType.MarkdownEditor,
      options: {
        label: key,
        outputFormat: 'markdown', // Default to markdown only
        ...options,
      },
    }
  }

  /**
   * Creates a Markdown editor field with image upload support
   */
  static markdownEditorWithImages(
    key: string,
    imageUploadHandler: (file: File) => Promise<string>,
    options: Partial<MarkdownEditorOptions> = {}
  ): FormField {
    return {
      key,
      type: FormFieldType.MarkdownEditor,
      options: {
        label: key,
        enableImageUpload: true,
        imageUploadHandler,
        maxImageSize: 5 * 1024 * 1024, // 5MB default
        allowedImageTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        imageUploadMode: 'custom',
        ...options,
      },
    }
  }

  /**
   * Creates an email input field with built-in email validation.
   * 
   * @param key - Unique identifier for the field
   * @param options - Configuration options including label, placeholder, validation, etc.
   * @returns An email field definition
   * 
   * @example
   * ```tsx
   * FormFieldClass.email('email', { 
   *   label: 'Email Address', 
   *   required: true,
   *   placeholder: 'user@example.com'
   * })
   * ```
   */
  static email(key: string, options: EmailFieldOptions = {}): FormField {
    return this.field(FormFieldType.Email, key, options)
  }

  /**
   * Creates a password input field.
   * 
   * @param key - Unique identifier for the field
   * @param options - Configuration options including label, placeholder, validation, etc.
   * @returns A password field definition
   * 
   * @example
   * ```tsx
   * FormFieldClass.password('password', { 
   *   label: 'Password', 
   *   required: true,
   *   validate: (value) => value.length >= 8 || 'Password must be at least 8 characters'
   * })
   * ```
   */
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

  static button(key: string, options: ButtonOptions = {}): FormField {
    const { label, ...rest } = options
    return this.field(FormFieldType.Button, key, rest)
  }

  static datePicker(key: string, options: DatePickerOptions = {}): FormField {
    return this.field(FormFieldType.DatePicker, key, options)
  }

  static dateTimePicker(key: string, options: DatePickerOptions = {}): FormField {
    return this.field(FormFieldType.DateTimePicker, key, options)
  }

  static select(key: string, options: SelectOptions): FormField {
    return this.field(FormFieldType.Select, key, options)
  }

  static enumSelect(key: string, options: EnumSelectOptions): FormField {
    return this.field(FormFieldType.EnumSelect, key, options)
  }

  static searchSelect(key: string, options: SearchSelectOptions): FormField {
    return this.field(FormFieldType.SearchSelect, key, options)
  }

  static searchSelectApollo<TDataItem>(key: string, options: SearchSelectApolloOptions<TDataItem>): FormField {
    return this.field(FormFieldType.SearchSelectApollo, key, options)
  }

  static searchSelectMulti(key: string, options: SearchSelectMultiOptions): FormField {
    return this.field(FormFieldType.SearchSelectMulti, key, options)
  }

  static searchSelectMultiApollo<TDataItem>(key: string, options: SearchSelectApolloOptions<TDataItem>): FormField {
    return this.field(FormFieldType.SearchSelectMultiApollo, key, options)
  }

  static content(key: string, options: ContentOptions): FormField {
    return this.field(FormFieldType.Content, key, options)
  }

  static custom<T = unknown>(key: string, options: CustomFieldOptions<T>): FormField {
    return this.field(FormFieldType.Custom, key, options)
  }
}
