export interface BaseFieldOptions {
  // ... existing BaseFieldOptions interface code ...
}

export interface DatePickerOptions extends BaseFieldOptions {
  defaultValue?: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm for datetime
  useController?: boolean
  min?: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm for datetime
  max?: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm for datetime
  placeholder?: string
  step?: number // For datetime inputs, step in seconds
  helpText?: string // Optional help text for accessibility and guidance
} 