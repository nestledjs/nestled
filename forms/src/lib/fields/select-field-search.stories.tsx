import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { SelectFieldSearch } from './select-field-search'
import { FormFieldType, FormField } from '../form-types'
import { useFormTheme } from '../theme-context'

/**
 * The SelectFieldSearch component provides a searchable dropdown with client-side filtering.
 * It's built using Headless UI's Combobox component and supports custom option lists and debounced search.
 * 
 * **Key Features:**
 * - Client-side search filtering
 * - No external dependencies (no Apollo required)
 * - Debounced search input
 * - Single selection with searchable interface
 * - Built-in accessibility with Headless UI
 * - Customizable styling through theme system
 * - Read-only support with multiple display modes
 * 
 * ## Usage Example:
 * 
 * ```tsx
 * const field = {
 *   key: 'selectedUser',
 *   type: FormFieldType.SearchSelect,
 *   options: {
 *     label: 'Select User',
 *     options: [
 *       { value: '1', label: 'John Doe' },
 *       { value: '2', label: 'Jane Smith' },
 *       { value: '3', label: 'Bob Johnson' },
 *     ],
 *     placeholder: 'Search users...',
 *     defaultValue: null,
 *     required: true
 *   }
 * }
 * ```
 * 
 * ## Differences from Apollo Version:
 * - Takes static `options` array instead of GraphQL query
 * - Client-side filtering instead of server-side search
 * - No loading states or API calls
 * - Simpler setup and configuration
 * - Better for smaller datasets or pre-loaded options
 */
const meta: Meta<typeof SelectFieldSearch> = {
  title: 'Forms/SelectFieldSearch',
  component: SelectFieldSearch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A searchable dropdown component with client-side filtering. Unlike the Apollo version, this component works with static option lists and doesn't require GraphQL setup.

### Field Configuration

\`\`\`typescript
{
  key: 'fieldKey',
  type: FormFieldType.SearchSelect,
  options: {
    label: 'Field Label',
    options: [                        // Array of options
      { value: 'id1', label: 'Option 1' },
      { value: 'id2', label: 'Option 2' },
    ],
    placeholder: 'Search...',          // Optional search placeholder
    defaultValue: null,               // Default selected item
    required: true,                   // Optional validation
    disabled: false,                  // Optional disable state
    readOnly: false,                  // Optional read-only mode
    readOnlyStyle: 'value'            // 'value' | 'disabled'
  }
}
\`\`\`

### Advantages

- **No Dependencies**: Works without Apollo Client or GraphQL
- **Client-side Filtering**: Fast search through pre-loaded options
- **Simple Setup**: Just provide an array of options
- **Immediate Results**: No API calls or loading states
- **Offline Friendly**: Works without network connectivity

### When to Use

- Small to medium datasets (< 1000 options)
- Pre-loaded option lists
- Offline applications
- Simple use cases without complex server-side filtering
- When Apollo Client is not available or desired

### For Apollo Integration

Use \`SelectFieldSearchApollo\` if you need GraphQL integration with server-side search.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SelectFieldSearch>

// Mock options for all stories
const mockUsers = [
  { value: '1', label: 'John Doe' },
  { value: '2', label: 'Jane Smith' },
  { value: '3', label: 'Bob Johnson' },
  { value: '4', label: 'Alice Brown' },
  { value: '5', label: 'Charlie Wilson' },
  { value: '6', label: 'Diana Prince' },
  { value: '7', label: 'Edward Cullen' },
  { value: '8', label: 'Fiona Green' },
  { value: '9', label: 'George Miller' },
  { value: '10', label: 'Hannah White' },
]

const mockFruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
]

// Story wrapper component
function StoryWrapper({ 
  field, 
  hasError = false, 
  formReadOnly = false, 
  formReadOnlyStyle = 'value' as const 
}: {
  field: Extract<FormField, { type: FormFieldType.SearchSelect }>
  hasError?: boolean
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const form = useForm()
  const theme = useFormTheme()
  
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <SelectFieldSearch
          form={form}
          field={field}
          hasError={hasError}
          formReadOnly={formReadOnly}
          formReadOnlyStyle={formReadOnlyStyle}
        />
        {hasError && (
          <p className="text-sm text-red-600">This field is required</p>
        )}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600 mb-2">Current Value:</p>
        <pre className="text-xs bg-white p-2 rounded border">
          {JSON.stringify(form.watch(field.key) || null, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export const Basic: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'basicSearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Select User',
          options: mockUsers,
          placeholder: 'Search users...',
          defaultValue: null,
        },
      }}
    />
  ),
}

export const WithDefaultSelection: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'withDefaultSelection',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Assigned User',
          options: mockUsers,
          placeholder: 'Change user...',
          defaultValue: '3',
        },
      }}
    />
  ),
}

export const Required: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'requiredSearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Required Selection',
          options: mockUsers,
          placeholder: 'You must select someone...',
          defaultValue: null,
          required: true,
        },
      }}
      hasError={true}
    />
  ),
}

export const Disabled: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'disabledSearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Disabled Field',
          options: mockUsers,
          placeholder: 'Cannot search...',
          defaultValue: '2',
          disabled: true,
        },
      }}
    />
  ),
}

export const ReadOnlyValue: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'readOnlyValueSearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Read-Only (Plain Text)',
          options: mockUsers,
          defaultValue: '5',
          readOnly: true,
          readOnlyStyle: 'value',
        },
      }}
    />
  ),
}

export const ReadOnlyDisabled: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'readOnlyDisabledSearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Read-Only (Disabled Input)',
          options: mockUsers,
          defaultValue: '8',
          readOnly: true,
          readOnlyStyle: 'disabled',
        },
      }}
    />
  ),
}

export const LargeDataset: Story = {
  render: () => {
    const largeOptions = Array.from({ length: 100 }, (_, i) => ({
      value: `user-${i + 1}`,
      label: `User ${i + 1}`,
    }))
    
    return (
      <StoryWrapper
        field={{
          key: 'largeDatasetSearch',
          type: FormFieldType.SearchSelect,
          options: {
            label: 'Large Dataset (100 users)',
            options: largeOptions,
            placeholder: 'Search through 100 users...',
            defaultValue: null,
          },
        }}
      />
    )
  },
}

export const CustomPlaceholder: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'customPlaceholderSearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Favorite Fruit',
          options: mockFruits,
          placeholder: 'Type to find delicious fruits...',
          defaultValue: null,
        },
      }}
    />
  ),
}

export const FormLevelReadOnly: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'formLevelReadOnlySearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Form-Level Read-Only',
          options: mockUsers,
          defaultValue: '4',
        },
      }}
      formReadOnly={true}
      formReadOnlyStyle="value"
    />
  ),
}

export const EmptyOptions: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'emptyOptionsSearch',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'No Options Available',
          options: [],
          placeholder: 'No options to search...',
          defaultValue: null,
        },
      }}
    />
  ),
}

export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  render: () => {
    const departments = [
      { value: 'engineering', label: 'Engineering' },
      { value: 'design', label: 'Design' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'sales', label: 'Sales' },
      { value: 'hr', label: 'Human Resources' },
      { value: 'finance', label: 'Finance' },
      { value: 'support', label: 'Customer Support' },
    ]
    
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">SelectFieldSearch Demo</h2>
          <p className="text-gray-600">
            Try searching and selecting a department
          </p>
        </div>
        
        <StoryWrapper
          field={{
            key: 'interactiveDemoSearch',
            type: FormFieldType.SearchSelect,
            options: {
              label: 'Department',
              options: departments,
              placeholder: 'Search and select department...',
              defaultValue: 'engineering',
              required: true,
            },
          }}
        />
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Type in the search box to filter options</li>
            <li>• Click options to select them</li>
            <li>• Use keyboard navigation (arrows, enter, escape)</li>
            <li>• Search is debounced for smooth performance</li>
            <li>• Works completely offline with static options</li>
          </ul>
        </div>
      </div>
    )
  },
} 