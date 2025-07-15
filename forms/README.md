# @nestledjs/forms

A flexible React form library that supports both **declarative** and **imperative** usage patterns with full TypeScript support.

## 🚀 Features

- **Dual API**: Use declaratively with field arrays or imperatively with individual components
- **TypeScript First**: Full type safety and IntelliSense support
- **Flexible**: Mix and match declarative and imperative patterns
- **Themeable**: Customizable styling system
- **Validation**: Built-in validation with react-hook-form
- **Read-only Support**: Toggle between editable and read-only modes
- **Rich Field Types**: 20+ field types including text, email, select, date pickers, markdown editor, and more

## 📦 Installation

```bash
npm install @nestledjs/forms
# or
yarn add @nestledjs/forms
# or
pnpm add @nestledjs/forms
```

**Note**: The markdown editor component uses `@mdxeditor/editor` which is included as a dependency. Make sure your build system supports CSS imports for the editor styles.

## 🎯 Quick Start

### Declarative Usage (Recommended)

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

### Imperative Usage

Perfect for dynamic forms or when you need fine-grained control:

```tsx
import { Form, RenderFormField, FormFieldClass } from '@nestledjs/forms'

function DynamicContactForm() {
  const [showPhone, setShowPhone] = useState(false)
  
  return (
    <Form
      id="contact-form"
      submit={(values) => console.log('Submitted:', values)}
    >
      <RenderFormField 
        field={FormFieldClass.text('name', { label: 'Name', required: true })} 
      />
      
      <RenderFormField 
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
        <RenderFormField 
          field={FormFieldClass.phone('phone', { label: 'Phone Number' })} 
        />
      )}
      
      <RenderFormField 
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

### Mixed Usage

Combine both approaches for maximum flexibility:

```tsx
import { Form, RenderFormField, FormFieldClass } from '@nestledjs/forms'

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
      <RenderFormField 
        field={FormFieldClass.password('password', { 
          label: 'Password', 
          required: true 
        })} 
      />
      
      <RenderFormField 
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

### Rich Text Editing with Markdown

Create forms with rich text editing capabilities:

```tsx
import { Form, RenderFormField, FormFieldClass } from '@nestledjs/forms'

function BlogPostForm() {
  const handleImageUpload = async (file: File): Promise<string> => {
    // Upload image to your server/CDN
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    const { url } = await response.json()
    return url
  }

  return (
    <Form
      id="blog-post-form"
      submit={(values) => console.log('Blog post:', values)}
    >
      <RenderFormField 
        field={FormFieldClass.text('title', { 
          label: 'Post Title', 
          required: true,
          placeholder: 'Enter your blog post title...'
        })} 
      />
      
      <RenderFormField 
        field={FormFieldClass.text('slug', { 
          label: 'URL Slug', 
          placeholder: 'my-blog-post'
        })} 
      />
      
      <RenderFormField 
        field={FormFieldClass.markdownEditor('content', { 
          label: 'Post Content',
          required: true,
          height: 400,
          placeholder: 'Write your blog post content...\n\n**Use markdown** for formatting!\n\n- Bullet lists\n1. Numbered lists\n- [x] Checkboxes\n\n```javascript\nconsole.log("Code blocks work too!")\n```',
          enableImageUpload: true,
          imageUploadHandler: handleImageUpload,
          maxImageSize: 5 * 1024 * 1024, // 5MB
          allowedImageTypes: ['image/png', 'image/jpeg', 'image/gif'],
          maxLength: 10000,
          helpText: 'Supports markdown formatting, images, and code blocks'
        })} 
      />
      
      <RenderFormField 
        field={FormFieldClass.select('category', {
          label: 'Category',
          options: [
            { value: 'tech', label: 'Technology' },
            { value: 'design', label: 'Design' },
            { value: 'business', label: 'Business' }
          ]
        })} 
      />
      
      <RenderFormField 
        field={FormFieldClass.switch('published', { 
          label: 'Publish immediately'
        })} 
      />
      
      <button type="submit">Save Post</button>
    </Form>
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

// Rich text editing
FormFieldClass.markdownEditor('field', { 
  label: 'Content', 
  height: 300,
  placeholder: 'Enter your markdown content...',
  enableImageUpload: true,
  maxLength: 5000
})

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

// Search and select fields
FormFieldClass.searchSelect('field', { 
  label: 'Search Select',
  options: [{ value: 'a', label: 'Option A' }]
})
FormFieldClass.searchSelectApollo('field', { 
  label: 'Apollo Search Select',
  document: MY_GRAPHQL_QUERY,
  dataType: 'users',
  searchFields: ['name', 'email', 'firstName'],
  selectOptionsFunction: (items) => items.map(item => ({ 
    value: item.id, 
    label: item.name 
  }))
})
FormFieldClass.searchSelectMulti('field', { 
  label: 'Multi Search Select',
  options: [{ value: 'a', label: 'Option A' }]
})
FormFieldClass.searchSelectMultiApollo('field', { 
  label: 'Apollo Multi Search Select',
  document: MY_GRAPHQL_QUERY,
  dataType: 'users',
  searchFields: ['name', 'email', 'firstName'],
  selectOptionsFunction: (items) => items.map(item => ({ 
    value: item.id, 
    label: item.name 
  }))
})

FormFieldClass.custom('field', {
  label: 'Custom Field',
  customField: ({ value, onChange }) => (
    <MyCustomComponent value={value} onChange={onChange} />
  )
})
```

## 🚀 Apollo GraphQL Integration

For applications using Apollo Client, the forms library provides specialized search components that integrate with your GraphQL API:

### SearchSelectApollo

Single-select dropdown with server-side search:

```tsx
import { gql } from '@apollo/client'

const SEARCH_USERS_QUERY = gql`
  query SearchUsers($input: SearchInput) {
    users(input: $input) {
      id
      name
      firstName
      lastName
      email
    }
  }
`

FormFieldClass.searchSelectApollo('selectedUser', {
  label: 'Select User',
  document: SEARCH_USERS_QUERY,
  dataType: 'users',
  searchFields: ['name', 'firstName', 'lastName', 'email'], // Configure which fields to search
  selectOptionsFunction: (users) => users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  })),
  filter: (users) => users.slice(0, 10) // Optional client-side filtering
})
```

### SearchSelectMultiApollo

Multi-select dropdown with server-side search:

```tsx
FormFieldClass.searchSelectMultiApollo('selectedUsers', {
  label: 'Select Team Members',
  document: SEARCH_USERS_QUERY,
  dataType: 'users',
  searchFields: ['name', 'firstName', 'lastName', 'email'],
  selectOptionsFunction: (users) => users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }))
})
```

### Key Features

- **Dynamic Search Fields**: Use `searchFields` to specify which backend fields should be searched
- **Server-side Search**: Efficient handling of large datasets
- **Custom Data Mapping**: Transform API responses with `selectOptionsFunction`
- **Debounced Search**: 500ms delay to reduce API calls
- **Loading States**: Built-in loading indicators
- **Type Safety**: Full TypeScript support with generic data types

### GraphQL Requirements

Your GraphQL queries must accept an `input` parameter:

```graphql
type SearchInput {
  search: String
  searchFields: [String!]  # Frontend specifies which fields to search
  limit: Int
  offset: Int
}

query SearchUsers($input: SearchInput) {
  users(input: $input) {
    id
    name
    firstName
    lastName
    email
  }
}
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
import { Form, RenderFormField, FormFieldClass } from '@nestledjs/forms'

function MultiColumnForm() {
  return (
    <Form id="multi-column-form" submit={(values) => console.log(values)}>
      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RenderFormField 
          field={FormFieldClass.text('firstName', { label: 'First Name' })}
          className="col-span-1"
        />
        <RenderFormField 
          field={FormFieldClass.text('lastName', { label: 'Last Name' })}
          className="col-span-1"
        />
      </div>

      {/* Full-width field */}
      <RenderFormField 
        field={FormFieldClass.email('email', { label: 'Email Address' })}
      />

      {/* Three-column grid for address */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RenderFormField 
          field={FormFieldClass.text('street', { label: 'Street' })}
          className="col-span-2"
        />
        <RenderFormField 
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
          <RenderFormField key={field.key} field={field} />
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
      <RenderFormField 
        field={FormFieldClass.checkbox('newsletter', { 
          label: 'Subscribe to newsletter',
          layout: 'horizontal'  // Label and input on same line
        })}
      />
      
      <RenderFormField 
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
      <RenderFormField 
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

## ✍️ Markdown Editor Configuration

The markdown editor provides rich text editing with full markdown support:

```tsx
FormFieldClass.markdownEditor('content', {
  label: 'Content',
  required: true,
  
  // Editor appearance
  height: 400,
  placeholder: 'Enter your content...',
  
  // Content validation
  maxLength: 5000,
  
  // Image upload configuration
  enableImageUpload: true,
  imageUploadHandler: async (file: File) => {
    // Custom upload logic
    const formData = new FormData()
    formData.append('image', file)
    const response = await fetch('/api/upload', { method: 'POST', body: formData })
    const { url } = await response.json()
    return url
  },
  imageUploadMode: 'custom', // 'base64' | 'custom' | 'immediate'
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  
  // Help text
  helpText: 'Supports markdown formatting, images, and code blocks',
  
  // Read-only configuration
  readOnly: false,
  readOnlyStyle: 'value', // 'value' | 'disabled'
})
```

### Markdown Editor Features

- **Rich text toolbar** with formatting options
- **Live preview** of markdown content
- **Image upload** with drag-and-drop support
- **Code blocks** with syntax highlighting
- **Lists** (bullet, numbered, checkbox)
- **Links** and **blockquotes**
- **Keyboard shortcuts** for common actions
- **Read-only mode** for viewing content

### Markdown Editor Usage Tips

1. **Lists**: Use the toolbar button to toggle between bullet and numbered lists
2. **Images**: Drag and drop images directly into the editor
3. **Code blocks**: Use triple backticks (```) for code blocks
4. **Shortcuts**: Press `Ctrl+B` for bold, `Ctrl+I` for italic, etc.
5. **Checkboxes**: Type `- [ ]` for unchecked or `- [x]` for checked items

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
- **`RenderFormField`**: Renders individual form fields (imperative usage)
- **`FormFieldClass`**: Factory class for creating field definitions

### Hooks

- **`useFormContext<T>()`**: Access form state and methods
- **`useFormConfig()`**: Access form configuration (label display, etc.)
- **`useFormTheme()`**: Access current theme configuration

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

## 📄 License

MIT License - see LICENSE file for details.
