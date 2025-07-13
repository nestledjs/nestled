# @nestledjs/forms

A flexible React form library that supports both **declarative** and **imperative** usage patterns with full TypeScript support.

## 🚀 Features

- **Dual API**: Use declaratively with field arrays or imperatively with individual components
- **Standalone Fields**: Use fields outside of forms for filters, settings, and other UI elements
- **TypeScript First**: Full type safety and IntelliSense support
- **Flexible**: Mix and match declarative and imperative patterns
- **Themeable**: Customizable styling system with per-field theme overrides
- **Validation**: Built-in validation with react-hook-form
- **Read-only Support**: Toggle between editable and read-only modes
- **Rich Field Types**: 20+ field types including text, email, select, date pickers, and more

## 📦 Installation

```bash
npm install @nestledjs/forms
# or
yarn add @nestledjs/forms
# or
pnpm add @nestledjs/forms
```

## 🎯 Quick Start

### 1. Form Fields (Most Common)

Use `Field` components within forms for most use cases:

#### Declarative Usage (Recommended)

Perfect for forms where you can define all fields upfront:

```tsx
import { Form, FormFieldClass } from '@nestledjs/forms'

function UserRegistrationForm() {
  const fields = [
    FormFieldClass.text('firstName', { 
      label: 'First Name', 
      required: true 
    }),
    FormFieldClass.text('lastName', { 
      label: 'Last Name', 
      required: true 
    }),
    FormFieldClass.email('email', { 
      label: 'Email Address', 
      required: true,
      placeholder: 'user@example.com'
    }),
    FormFieldClass.password('password', { 
      label: 'Password', 
      required: true,
      validate: (value) => value.length >= 8 || 'Password must be at least 8 characters'
    }),
    FormFieldClass.select('role', {
      label: 'Role',
      options: [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' }
      ]
    })
  ]

  return (
    <Form
      id="registration-form"
      fields={fields}
      submit={(values) => {
        console.log('Form submitted:', values)
        // Handle form submission
      }}
    >
      <button type="submit">Register</button>
    </Form>
  )
}
```

#### Imperative Usage

Perfect for dynamic forms or when you need fine-grained control:

```tsx
import { Form, Field, FormFieldClass } from '@nestledjs/forms'

function DynamicContactForm() {
  const [showPhone, setShowPhone] = useState(false)
  
  return (
    <Form
      id="contact-form"
      submit={(values) => console.log('Submitted:', values)}
    >
      <Field 
        field={FormFieldClass.text('name', { label: 'Name', required: true })} 
      />
      
      <Field 
        field={FormFieldClass.email('email', { label: 'Email', required: true })} 
      />
      
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={showPhone}
            onChange={(e) => setShowPhone(e.target.checked)}
          />
          Include phone number
        </label>
      </div>
      
      {showPhone && (
        <Field 
          field={FormFieldClass.phone('phone', { label: 'Phone Number' })} 
        />
      )}
      
      <Field 
        field={FormFieldClass.textArea('message', { 
          label: 'Message', 
          rows: 4,
          placeholder: 'Tell us how we can help...'
        })} 
      />
      
      <button type="submit">Send Message</button>
    </Form>
  )
}
```

#### Mixed Usage

Combine both approaches for maximum flexibility:

```tsx
import { Form, Field, FormFieldClass } from '@nestledjs/forms'

function MixedForm() {
  const staticFields = [
    FormFieldClass.text('username', { label: 'Username', required: true }),
    FormFieldClass.email('email', { label: 'Email', required: true }),
  ]

  return (
    <Form
      id="mixed-form"
      fields={staticFields}
      submit={(values) => console.log('Submitted:', values)}
    >
      {/* Static fields are rendered automatically from the fields prop */}
      
      {/* Add dynamic fields as children */}
      <Field 
        field={FormFieldClass.password('password', { 
          label: 'Password', 
          required: true 
        })} 
      />
      
      <Field 
        field={FormFieldClass.checkbox('terms', { 
          label: 'I agree to the terms and conditions',
          required: true
        })} 
      />
      
      <button type="submit">Sign Up</button>
    </Form>
  )
}
```

### 2. Standalone Fields (Outside Forms)

Use `RenderField` for individual fields outside of forms:

Perfect for filters, settings panels, and other standalone UI elements:

```tsx
import { RenderField, FormFieldClass } from '@nestledjs/forms'
import { useState } from 'react'

function FilterComponent() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  return (
    <div className="filter-panel p-4 border rounded">
      <h3>Filters</h3>
      
      {/* Standalone select field */}
      <RenderField
        field={FormFieldClass.select('category', {
          label: 'Category',
          options: [
            { value: 'all', label: 'All Categories' },
            { value: 'electronics', label: 'Electronics' },
            { value: 'books', label: 'Books' },
            { value: 'clothing', label: 'Clothing' }
          ]
        })}
        value={selectedCategory}
        onChange={setSelectedCategory}
      />
      
      {/* Standalone search field */}
      <RenderField
        field={FormFieldClass.text('search', {
          label: 'Search',
          placeholder: 'Search products...'
        })}
        value={searchTerm}
        onChange={setSearchTerm}
        theme={{
          textField: {
            input: 'border-2 border-blue-300 rounded-lg px-3 py-2'
          }
        }}
      />
      
      {/* Results display */}
      <div className="mt-4">
        <p>Category: {selectedCategory}</p>
        <p>Search: {searchTerm}</p>
      </div>
    </div>
  )
}
```

## 🛠️ Available Field Types

The `FormFieldClass` provides methods for creating all field types:

```tsx
// Text inputs
FormFieldClass.text('field', { label: 'Text Field' })
FormFieldClass.textArea('field', { label: 'Text Area', rows: 4 })
FormFieldClass.email('field', { label: 'Email Field' })
FormFieldClass.password('field', { label: 'Password Field' })
FormFieldClass.url('field', { label: 'URL Field' })
FormFieldClass.phone('field', { label: 'Phone Field' })

// Numbers and currency
FormFieldClass.number('field', { label: 'Number', min: 0, max: 100 })
FormFieldClass.currency('field', { label: 'Price', currency: 'USD' })

// Selections
FormFieldClass.select('field', { 
  label: 'Select', 
  options: [{ value: 'a', label: 'Option A' }] 
})
FormFieldClass.multiSelect('field', { 
  label: 'Multi Select', 
  options: [{ value: 'a', label: 'Option A' }] 
})
FormFieldClass.radio('field', { 
  label: 'Radio', 
  radioOptions: [{ value: 'a', label: 'Option A' }] 
})

// Checkboxes and switches
FormFieldClass.checkbox('field', { label: 'Checkbox' })
FormFieldClass.switch('field', { label: 'Switch' })

// Date and time
FormFieldClass.datePicker('field', { label: 'Date' })
FormFieldClass.dateTimePicker('field', { label: 'Date & Time' })
FormFieldClass.timePicker('field', { label: 'Time' })

// Advanced fields
FormFieldClass.searchSelect('field', { 
  label: 'Search Select',
  searchQuery: MY_GRAPHQL_QUERY,
  optionsMap: (items) => items.map(item => ({ value: item.id, label: item.name }))
})

FormFieldClass.custom('field', {
  label: 'Custom Field',
  customField: ({ value, onChange }) => (
    <MyCustomComponent value={value} onChange={onChange} />
  )
})
```

## 🎨 Theming

Customize the appearance of your forms:

```tsx
import { Form, FormFieldClass, tailwindTheme } from '@nestledjs/forms'

const customTheme = {
  textField: {
    input: 'border-2 border-blue-500 rounded-lg px-3 py-2',
    error: 'border-red-500',
    disabled: 'bg-gray-100'
  },
  button: {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
  }
}

function ThemedForm() {
  return (
    <Form
      id="themed-form"
      theme={customTheme}
      fields={[
        FormFieldClass.text('name', { label: 'Name' }),
        FormFieldClass.email('email', { label: 'Email' })
      ]}
      submit={(values) => console.log(values)}
    >
      <button type="submit" className={customTheme.button.primary}>
        Submit
      </button>
    </Form>
  )
}
```

## 📐 Multi-Column Layouts

Create responsive multi-column layouts using CSS Grid or Flexbox:

### CSS Grid Approach

```tsx
import { Form, Field, FormFieldClass } from '@nestledjs/forms'

function MultiColumnForm() {
  return (
    <Form id="multi-column-form" submit={(values) => console.log(values)}>
      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field 
          field={FormFieldClass.text('firstName', { label: 'First Name' })}
          className="col-span-1"
        />
        <Field 
          field={FormFieldClass.text('lastName', { label: 'Last Name' })}
          className="col-span-1"
        />
      </div>

      {/* Full-width field */}
      <Field 
        field={FormFieldClass.email('email', { label: 'Email Address' })}
      />

      {/* Three-column grid for address */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field 
          field={FormFieldClass.text('street', { label: 'Street' })}
          className="col-span-2"
        />
        <Field 
          field={FormFieldClass.text('zipCode', { label: 'ZIP' })}
          className="col-span-1"
        />
      </div>

      <button type="submit">Submit</button>
    </Form>
  )
}
```

### Using wrapperClassName in Field Options

```tsx
function GridFormWithFieldOptions() {
  const fields = [
    FormFieldClass.text('firstName', { 
      label: 'First Name',
      wrapperClassName: 'col-span-1'
    }),
    FormFieldClass.text('lastName', { 
      label: 'Last Name',
      wrapperClassName: 'col-span-1'
    }),
    FormFieldClass.email('email', { 
      label: 'Email Address',
      wrapperClassName: 'col-span-2'
    }),
  ]

  return (
    <Form id="grid-form" submit={(values) => console.log(values)}>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(field => (
          <Field key={field.key} field={field} />
        ))}
      </div>
      <button type="submit">Submit</button>
    </Form>
  )
}
```

### Horizontal Field Layout

```tsx
function HorizontalLayoutForm() {
  return (
    <Form id="horizontal-form" submit={(values) => console.log(values)}>
      <Field 
        field={FormFieldClass.checkbox('newsletter', { 
          label: 'Subscribe to newsletter',
          layout: 'horizontal'  // Label and input on same line
        })}
      />
      
      <Field 
        field={FormFieldClass.checkbox('terms', { 
          label: 'I agree to the terms and conditions',
          layout: 'horizontal'
        })}
      />
      
      <button type="submit">Submit</button>
    </Form>
  )
}
```

### Custom Wrapper Functions

```tsx
function CustomWrapperForm() {
  return (
    <Form id="custom-wrapper-form" submit={(values) => console.log(values)}>
      <Field 
        field={FormFieldClass.text('amount', { 
          label: 'Amount',
          customWrapper: (children) => (
            <div className="flex items-end space-x-2">
              <div className="flex-1">{children}</div>
              <span className="text-gray-500 pb-2">USD</span>
            </div>
          )
        })}
      />
      
      <button type="submit">Submit</button>
    </Form>
  )
}
```

## 🔒 Read-only Mode

Toggle forms between editable and read-only modes:

```tsx
function ReadOnlyForm() {
  const [isReadOnly, setIsReadOnly] = useState(false)
  
  return (
    <div>
      <button onClick={() => setIsReadOnly(!isReadOnly)}>
        {isReadOnly ? 'Edit' : 'View'}
      </button>
      
      <Form
        id="readonly-form"
        readOnly={isReadOnly}
        readOnlyStyle="value" // 'value' or 'disabled'
        fields={[
          FormFieldClass.text('name', { label: 'Name' }),
          FormFieldClass.email('email', { label: 'Email' })
        ]}
        submit={(values) => console.log(values)}
      />
    </div>
  )
}
```

## 🧩 Custom Field Components

Create custom field components using the provided hooks:

```tsx
import { useFormContext, useFormTheme } from '@nestledjs/forms'

function CustomColorPicker({ fieldKey, label }) {
  const form = useFormContext()
  const theme = useFormTheme()
  
  return (
    <div>
      <label>{label}</label>
      <input
        type="color"
        {...form.register(fieldKey)}
        className={theme.textField.input}
      />
    </div>
  )
}

// Usage
function FormWithCustomField() {
  return (
    <Form id="custom-form" submit={(values) => console.log(values)}>
      <CustomColorPicker fieldKey="favoriteColor" label="Favorite Color" />
      <button type="submit">Submit</button>
    </Form>
  )
}
```

## 📝 Validation

Built-in validation support with custom validators:

```tsx
const fields = [
  FormFieldClass.text('username', {
    label: 'Username',
    required: true,
    validate: (value) => {
      if (value.length < 3) return 'Username must be at least 3 characters'
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores'
      return true
    }
  }),
  FormFieldClass.email('email', {
    label: 'Email',
    required: true,
    validate: async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`)
      const { exists } = await response.json()
      return exists ? 'Email already exists' : true
    }
  })
]
```

## 🎛️ Advanced Configuration

### Label Display Control

```tsx
<Form
  id="form"
  labelDisplay="none" // 'all' | 'default' | 'none'
  fields={fields}
  submit={handleSubmit}
/>
```

### Field-level Configuration

```tsx
const field = FormFieldClass.text('name', {
  label: 'Name',
  required: true,
  disabled: false,
  readOnly: false,
  readOnlyStyle: 'value', // 'value' | 'disabled'
  helpText: 'Enter your full name',
  placeholder: 'John Doe',
  defaultValue: 'Default Name',
  validate: (value) => value.length > 0 || 'Name is required'
})
```

## 📚 API Reference

### Core Components

- **`Form`**: Main form component supporting both declarative and imperative usage
- **`Field`**: Renders individual form fields within forms (imperative usage)
- **`RenderField`**: Renders standalone fields outside of forms (filters, settings, etc.)
- **`FormFieldClass`**: Factory class for creating field definitions

### Component Usage Guide

**Use `Field` when:**
- Building fields inside a `<Form>` component
- You need form validation and submission
- You want fields to participate in form state

**Use `RenderField` when:**
- Building standalone UI elements (filters, settings panels)
- You don't need form submission
- You want direct value/onChange control
- You need custom theming per field

### Hooks

- **`useFormContext<T>()`**: Access form state and methods
- **`useFormConfig()`**: Access form configuration (label display, etc.)
- **`useFormTheme()`**: Access current theme configuration

### Component Props

**`Field` Props:**
```tsx
interface FieldProps {
  field: FormField                    // Field definition
  formReadOnly?: boolean              // Override read-only mode
  formReadOnlyStyle?: 'value' | 'disabled'  // Read-only display style
  className?: string                  // Additional CSS classes
}
```

**`RenderField` Props:**
```tsx
interface RenderFieldProps {
  field: FormField                    // Field definition
  value?: any                         // Current field value
  onChange?: (value: any) => void     // Change handler
  disabled?: boolean                  // Disable the field
  readOnly?: boolean                  // Read-only mode
  readOnlyStyle?: 'value' | 'disabled'  // Read-only display style
  theme?: Partial<FormTheme>          // Theme overrides
  labelDisplay?: 'all' | 'default' | 'none'  // Label visibility
  className?: string                  // Additional CSS classes
}
```

### Types

- **`FormField`**: Union type of all possible field definitions
- **`FormFieldType`**: Enum of available field types
- **`FormProps<T>`**: Props interface for the Form component
- **`FormTheme`**: Theme configuration interface

## 🤝 TypeScript Support

The library is built with TypeScript-first design:

```tsx
interface UserFormData {
  name: string
  email: string
  age: number
  preferences: string[]
}

function TypedForm() {
  return (
    <Form<UserFormData>
      id="typed-form"
      fields={[
        FormFieldClass.text('name', { label: 'Name' }),
        FormFieldClass.email('email', { label: 'Email' }),
        FormFieldClass.number('age', { label: 'Age' }),
        FormFieldClass.multiSelect('preferences', { 
          label: 'Preferences',
          options: [
            { value: 'music', label: 'Music' },
            { value: 'sports', label: 'Sports' }
          ]
        })
      ]}
      submit={(values: UserFormData) => {
        // values is fully typed!
        console.log(values.name, values.email, values.age, values.preferences)
      }}
    />
  )
}
```

## 🎯 Best Practices

1. **Use declarative approach** when possible - it's more maintainable
2. **Combine with imperative** for dynamic scenarios
3. **Define field arrays outside render** to avoid unnecessary re-renders
4. **Use TypeScript generics** for type safety
5. **Leverage validation** for better user experience
6. **Consider read-only modes** for view/edit patterns

## 🔄 Backwards Compatibility

For backwards compatibility, `RenderFormField` is still available as an alias for `Field`:

```tsx
// ✅ New recommended usage
import { Field } from '@nestledjs/forms'
<Field field={myField} />

// ✅ Still works (backwards compatibility)
import { RenderFormField } from '@nestledjs/forms'
<RenderFormField field={myField} />
```

## 📄 License

MIT License - see LICENSE file for details.
