import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { SelectFieldMultiSearch } from './select-field-multi-search'
import { FormFieldType, FormField } from '../form-types'
import { useFormTheme } from '../theme-context'

/**
 * The SelectFieldMultiSearch component provides a multi-select searchable dropdown with client-side filtering.
 * It's built using Headless UI's Combobox component and supports custom option lists, debounced search, 
 * and multiple selection with tag-based UI.
 * 
 * **Key Features:**
 * - Client-side search filtering
 * - No external dependencies (no Apollo required)
 * - Debounced search input
 * - Multiple selection with removable tags
 * - Built-in accessibility with Headless UI
 * - Customizable styling through theme system
 * - Read-only support with multiple display modes
 * 
 * ## Usage Example:
 * 
 * ```tsx
 * const field = {
 *   key: 'selectedItems',
 *   type: FormFieldType.SearchSelectMulti,
 *   options: {
 *     label: 'Select Items',
 *     options: [
 *       { value: '1', label: 'Option 1' },
 *       { value: '2', label: 'Option 2' },
 *       { value: '3', label: 'Option 3' },
 *     ],
 *     placeholder: 'Search and select...',
 *     defaultValue: [],
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
const meta: Meta<typeof SelectFieldMultiSearch> = {
  title: 'Forms/SelectFieldMultiSearch',
  component: SelectFieldMultiSearch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A multi-select searchable dropdown component with client-side filtering. Unlike the Apollo version, this component works with static option lists and doesn't require GraphQL setup.

### Field Configuration

\`\`\`typescript
{
  key: 'fieldKey',
  type: FormFieldType.SearchSelectMulti,
  options: {
    label: 'Field Label',
    options: [                        // Array of options
      { value: 'id1', label: 'Option 1' },
      { value: 'id2', label: 'Option 2' },
    ],
    placeholder: 'Search...',          // Optional search placeholder
    defaultValue: [],                 // Default selected items
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
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SelectFieldMultiSearch>

// Mock options for all stories
const mockOptions = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' },
  { value: '4', label: 'Date' },
  { value: '5', label: 'Elderberry' },
  { value: '6', label: 'Fig' },
  { value: '7', label: 'Grape' },
  { value: '8', label: 'Honeydew' },
  { value: '9', label: 'Kiwi' },
  { value: '10', label: 'Lemon' },
  { value: '11', label: 'Mango' },
  { value: '12', label: 'Orange' },
  { value: '13', label: 'Papaya' },
  { value: '14', label: 'Quince' },
  { value: '15', label: 'Raspberry' },
]

// Story wrapper component
function StoryWrapper({ 
  field, 
  hasError = false, 
  formReadOnly = false, 
  formReadOnlyStyle = 'value' as const 
}: {
  field: Extract<FormField, { type: FormFieldType.SearchSelectMulti }>
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
        <SelectFieldMultiSearch
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
          {JSON.stringify(form.watch(field.key) || [], null, 2)}
        </pre>
      </div>
    </div>
  )
}

export const Basic: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'basicMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Select Fruits',
          options: mockOptions,
          placeholder: 'Search fruits...',
          defaultValue: [],
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
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Favorite Fruits',
          options: mockOptions,
          placeholder: 'Add more fruits...',
          defaultValue: [
            { value: '1', label: 'Apple' },
            { value: '7', label: 'Grape' },
          ],
        },
      }}
    />
  ),
}

export const Required: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'requiredMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Required Selection',
          options: mockOptions,
          placeholder: 'You must select at least one...',
          defaultValue: [],
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
        key: 'disabledMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Disabled Field',
          options: mockOptions,
          placeholder: 'Cannot interact...',
          defaultValue: [
            { value: '2', label: 'Banana' },
            { value: '11', label: 'Mango' },
          ],
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
        key: 'readOnlyValueMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Read-Only (Plain Text)',
          options: mockOptions,
          defaultValue: [
            { value: '3', label: 'Cherry' },
            { value: '8', label: 'Honeydew' },
            { value: '15', label: 'Raspberry' },
          ],
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
        key: 'readOnlyDisabledMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Read-Only (Disabled Input)',
          options: mockOptions,
          defaultValue: [
            { value: '5', label: 'Elderberry' },
            { value: '12', label: 'Orange' },
          ],
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
      value: `item-${i + 1}`,
      label: `Item ${i + 1}`,
    }))
    
    return (
      <StoryWrapper
        field={{
          key: 'largeDatasetMultiSearch',
          type: FormFieldType.SearchSelectMulti,
          options: {
            label: 'Large Dataset (100 items)',
            options: largeOptions,
            placeholder: 'Search through 100 items...',
            defaultValue: [],
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
        key: 'customPlaceholderMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Custom Placeholder',
          options: mockOptions,
          placeholder: 'Type to find delicious fruits...',
          defaultValue: [],
        },
      }}
    />
  ),
}

export const FormLevelReadOnly: Story = {
  render: () => (
    <StoryWrapper
      field={{
        key: 'formLevelReadOnlyMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'Form-Level Read-Only',
          options: mockOptions,
          defaultValue: [
            { value: '4', label: 'Date' },
            { value: '9', label: 'Kiwi' },
          ],
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
        key: 'emptyOptionsMultiSearch',
        type: FormFieldType.SearchSelectMulti,
        options: {
          label: 'No Options Available',
          options: [],
          placeholder: 'No options to search...',
          defaultValue: [],
        },
      }}
    />
  ),
}

export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  render: () => {
    const categories = [
      { value: 'fruits', label: 'Fruits' },
      { value: 'vegetables', label: 'Vegetables' },
      { value: 'grains', label: 'Grains' },
      { value: 'proteins', label: 'Proteins' },
      { value: 'dairy', label: 'Dairy' },
    ]
    
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">SelectFieldMultiSearch Demo</h2>
          <p className="text-gray-600">
            Try searching, selecting multiple items, and removing selections
          </p>
        </div>
        
        <StoryWrapper
          field={{
            key: 'interactiveDemoMultiSearch',
            type: FormFieldType.SearchSelectMulti,
            options: {
              label: 'Food Categories',
              options: categories,
              placeholder: 'Search and select food categories...',
              defaultValue: [{ value: 'fruits', label: 'Fruits' }],
              required: true,
            },
          }}
        />
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Type in the search box to filter options</li>
            <li>• Click options to select them</li>
            <li>• Click the × button on tags to remove selections</li>
            <li>• Use keyboard navigation (arrows, enter, escape)</li>
            <li>• Search is debounced for smooth performance</li>
          </ul>
        </div>
      </div>
    )
  },
} 