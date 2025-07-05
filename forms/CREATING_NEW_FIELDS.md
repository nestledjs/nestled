# Creating New Form Fields

This guide provides a comprehensive walkthrough for adding new form field types to the forms library. When creating a new field, you'll need to update multiple files to ensure proper integration with the type system, theming, and rendering pipeline.

## Quick Checklist

When adding a new form field type, you must update these files in order:

- [ ] **form-types.ts** - Add type definitions
- [ ] **form-theme.ts** - Add theme schema
- [ ] **themes/tailwind.tsx** - Add default theme implementation  
- [ ] **utils/resolve-theme.ts** - Add to theme inheritance
- [ ] **form-fields.ts** - Add factory method
- [ ] **fields/[new-field].tsx** - Create the field component
- [ ] **render-form-field.tsx** - Add rendering logic
- [ ] **fields/[new-field].stories.tsx** - Create Storybook stories
- [ ] **index.ts** - Export the new field component

## Detailed Step-by-Step Process

### 1. Define Types (`form-types.ts`)

Add your new field type to the system by updating four key sections:

#### A. Add to FormFieldType Enum
```typescript
export enum FormFieldType {
  // ... existing types
  YourNewField = 'YourNewField',
}
```

#### B. Create Options Interface
```typescript
export interface YourNewFieldOptions extends BaseFieldOptions {
  // Field-specific options
  customProperty?: string
  anotherOption?: boolean
  // Always extend BaseFieldOptions for consistency
}
```

#### C. Create Field Interface
```typescript
interface YourNewFieldType {
  key: string
  type: FormFieldType.YourNewField
  options: YourNewFieldOptions
}
```

#### D. Add to FormField Union
```typescript
export type FormField =
  | InputField
  | TextAreaField
  // ... other types
  | YourNewFieldType  // Add your new type here
```

### 2. Define Theme Schema (`form-theme.ts`)

Add a theme section for your new field. This defines all the CSS class properties that can be themed:

```typescript
export const FormThemeSchema = z.object({
  // ... existing fields
  yourNewField: z
    .object({
      wrapper: z.string().default(''),
      input: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
      // Add any field-specific theme properties
      customElement: z.string().default(''),
      specialState: z.string().default(''),
    })
    .default({}),
})
```

**Theme Property Guidelines:**
- `wrapper` - Container around the entire field
- `input` - The main input element
- `error` - Error state styling
- `disabled` - Disabled state styling  
- `readOnly` - Read-only state styling
- `readOnlyInput` - Read-only input appearance
- `readOnlyValue` - Read-only plain text appearance
- Add field-specific properties as needed

### 3. Implement Default Theme (`themes/tailwind.tsx`)

Provide Tailwind CSS classes for your theme properties:

```typescript
export const tailwindTheme = FormThemeSchema.parse({
  // ... existing themes
  yourNewField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    customElement: 'your-custom-classes',
    specialState: 'special-styling-classes',
  },
})
```

**Theme Best Practices:**
- Use consistent sizing (`min-h-[2.5rem]` for consistency)
- Follow the existing color scheme (sky for focus, red for errors)
- Support both `readOnlyInput` and `readOnlyValue` styles
- Use `!important` syntax (`!border-red-600`) for error overrides

### 4. Add Theme Inheritance (`utils/resolve-theme.ts`)

Add your field to the theme inheritance system so it receives global styles:

#### A. Add to inheritableKeys Array
```typescript
const inheritableKeys: (keyof FormTheme)[] = [
  'textField',
  'checkbox',
  // ... existing keys
  'yourNewField',  // Add your field here
]
```

#### B. Add Type-Safe Merging Case
```typescript
for (const key of inheritableKeys) {
  const section = finalTheme[key]
  if (!section) continue

  if (key === 'textField') {
    finalTheme[key] = mergeSection(globalStyles, section as FormTheme['textField'])
  } else if (key === 'checkbox') {
    finalTheme[key] = mergeSection(globalStyles, section as FormTheme['checkbox'])
  }
  // ... existing cases
  else if (key === 'yourNewField') {
    finalTheme[key] = mergeSection(globalStyles, section as FormTheme['yourNewField'])
  }
}
```

### 5. Add Factory Method (`form-fields.ts`)

Create a factory method for easy field creation:

```typescript
export class FormFieldClass {
  // ... existing methods

  /**
   * Creates a your new field type.
   * 
   * @param key - Unique identifier for the field
   * @param options - Configuration options
   * @returns A your new field definition
   * 
   * @example
   * ```tsx
   * FormFieldClass.yourNewField('fieldKey', { 
   *   label: 'Field Label', 
   *   customProperty: 'value',
   *   required: true
   * })
   * ```
   */
  static yourNewField(key: string, options: YourNewFieldOptions = {}): FormField {
    return this.field(FormFieldType.YourNewField, key, options)
  }
}
```

### 6. Create Field Component (`fields/your-new-field.tsx`)

Create the actual React component that renders your field:

```typescript
import React from 'react'
import { Controller } from 'react-hook-form'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'

export function YourNewField({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.YourNewField }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()

  // Determine read-only state with field-level precedence
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle

  // Handle read-only rendering
  if (isReadOnly) {
    const value = form.getValues(field.key)
    const displayValue = value || '—'

    if (readOnlyStyle === 'disabled') {
      return (
        <input
          type="text"
          className={clsx(
            theme.yourNewField.readOnlyInput,
            hasError && theme.yourNewField.error
          )}
          disabled={true}
          value={displayValue}
        />
      )
    }
    // Render as plain value
    return (
      <div className={theme.yourNewField.readOnlyValue}>
        {displayValue}
      </div>
    )
  }

  // Regular field rendering
  return (
    <Controller
      control={form.control}
      name={field.key}
      defaultValue={field.options.defaultValue}
      rules={{ required: field.options.required }}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <div className={theme.yourNewField.wrapper}>
          <input
            ref={ref}
            type="text" // or whatever input type you need
            className={clsx(
              theme.yourNewField.input,
              hasError && theme.yourNewField.error,
              field.options.disabled && theme.yourNewField.disabled
            )}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={field.options.disabled}
            placeholder={field.options.placeholder}
            // Add any field-specific props
          />
        </div>
      )}
    />
  )
}
```

**Component Implementation Guidelines:**
- Always support both `formReadOnly` and field-level `readOnly`
- Handle both `readOnlyStyle` options: `'disabled'` and `'value'`
- Use `Controller` from react-hook-form for form integration
- Apply theme classes consistently
- Support error states, disabled states, and required validation

### 7. Add Rendering Logic (`render-form-field.tsx`)

#### A. Import Your Component
```typescript
import { YourNewField } from './fields/your-new-field'
```

#### B. Add Case to Switch Statement
```typescript
function renderComponent(
  form: ReturnType<typeof useFormContext>,
  field: FormField,
  formReadOnly: boolean,
  formReadOnlyStyle: 'value' | 'disabled',
) {
  const hasError = !!form.formState.errors[field.key]

  switch (field.type) {
    case FormFieldType.Text:
      return <TextField /* ... */ />
    // ... existing cases
    case FormFieldType.YourNewField:
      return (
        <YourNewField
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
```

### 8. Create Storybook Stories (`fields/your-new-field.stories.tsx`)

Create comprehensive test stories for your field:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'

const meta: Meta<typeof Form> = {
  title: 'Form Fields/YourNewField',
  component: Form,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof Form>

export const Basic: Story = {
  args: {
    id: 'your-new-field-basic',
    fields: [
      FormFieldClass.yourNewField('basic', {
        label: 'Basic Field',
        placeholder: 'Enter value...',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const Required: Story = {
  args: {
    id: 'your-new-field-required',
    fields: [
      FormFieldClass.yourNewField('required', {
        label: 'Required Field',
        required: true,
        placeholder: 'This field is required',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const Disabled: Story = {
  args: {
    id: 'your-new-field-disabled',
    fields: [
      FormFieldClass.yourNewField('disabled', {
        label: 'Disabled Field',
        disabled: true,
        defaultValue: 'Disabled value',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const ReadOnlyValue: Story = {
  args: {
    id: 'your-new-field-readonly-value',
    fields: [
      FormFieldClass.yourNewField('readonlyValue', {
        label: 'Read-Only (Value Style)',
        readOnly: true,
        defaultValue: 'Read-only value displayed as text',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    id: 'your-new-field-readonly-disabled',
    fields: [
      FormFieldClass.yourNewField('readonlyDisabled', {
        label: 'Read-Only (Disabled Style)',
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: 'Read-only value in disabled input',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const WithCustomProperties: Story = {
  args: {
    id: 'your-new-field-custom',
    fields: [
      FormFieldClass.yourNewField('custom', {
        label: 'Field with Custom Properties',
        customProperty: 'custom value',
        anotherOption: true,
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}
```

### 9. Export Component (`index.ts`)

Add your new component to the library exports:

```typescript
// Field components
export { TextField } from './lib/fields/text-field'
export { TextAreaField } from './lib/fields/textarea-field'
// ... existing exports
export { YourNewField } from './lib/fields/your-new-field'
```

## Testing Your New Field

After implementing all the steps above, test your new field:

### 1. Build the Library
```bash
pnpm nx run forms:build
```

### 2. Run Storybook
```bash
pnpm nx run forms:storybook
```

### 3. Test in Stories
- Verify all story variants work correctly
- Test form submission with field values
- Verify read-only and disabled states
- Check error handling and validation

### 4. Integration Test
Create a test form using your new field:

```typescript
<Form
  id="test-form"
  fields={[
    FormFieldClass.yourNewField('test', {
      label: 'Test Field',
      required: true,
      customProperty: 'test value',
    }),
  ]}
  submit={(values) => console.log(values)}
/>
```

## Common Patterns and Best Practices

### Read-Only Support
Always implement both read-only styles:
- `'value'` - Display as plain text (default)
- `'disabled'` - Display as disabled input

### Error Handling
Support error states consistently:
```typescript
className={clsx(
  theme.yourField.input,
  hasError && theme.yourField.error
)}
```

### Theme Inheritance
Your field will automatically inherit global theme styles. You can override specific properties in the field-specific theme section.

### Field-Level Overrides
Support field-level overrides for common properties:
```typescript
const isReadOnly = field.options.readOnly ?? formReadOnly
const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle
```

### Type Safety
The discriminated union ensures type safety. Extract your specific field type:
```typescript
FormFieldProps<Extract<FormField, { type: FormFieldType.YourNewField }>>
```

## Advanced Features

### Custom Validation
Add custom validation to your field options:
```typescript
export interface YourNewFieldOptions extends BaseFieldOptions {
  validate?: (value: any) => string | boolean | Promise<string | boolean>
}
```

### Complex State Management
For fields with complex internal state, use additional hooks:
```typescript
const [internalState, setInternalState] = useState()
const debouncedValue = useDebounce(value, 300)
```

### Third-Party Integration
For fields that integrate with external libraries, follow the Apollo pattern:
- Create base generic version
- Create library-specific version with suffix (e.g., `-apollo`)

### Performance Optimization
For expensive operations, consider:
- Memoizing computed values
- Using `ClientOnly` for client-side only features
- Debouncing user input

## Troubleshooting

### TypeScript Errors
- Ensure your field type is added to the `FormField` union
- Verify the Extract type in your component props
- Check that all required properties are defined

### Theme Issues
- Verify your field is added to `inheritableKeys` in `resolve-theme.ts`
- Check that theme properties have default values in the schema
- Ensure theme classes are properly applied with `clsx`

### Rendering Issues
- Confirm your field component is imported in `render-form-field.tsx`
- Verify the switch case matches your enum value exactly
- Check that the component is exported from `index.ts`

### Storybook Issues
- Ensure stories cover all major use cases
- Test with various field configurations
- Verify story args match your field options interface

By following this comprehensive guide, your new form field will be fully integrated into the forms library with proper type safety, theming support, and consistent behavior across all usage patterns. 