import type { Meta, StoryObj } from '@storybook/react'

/**
 * The SearchSelectField component provides a searchable dropdown with Apollo GraphQL integration.
 * It supports debounced search, custom data mapping, and filtering.
 * 
 * **Note:** This component requires Apollo Client to be set up in your application.
 * The stories below are for documentation purposes and show the component's API,
 * but cannot be fully interactive in Storybook without proper Apollo Client mocking.
 * 
 * ## Usage Example:
 * 
 * ```tsx
 * import { gql } from '@apollo/client'
 * 
 * const SEARCH_USERS_QUERY = gql`
 *   query SearchUsers($input: SearchInput) {
 *     users(input: $input) {
 *       id
 *       name
 *       firstName
 *       lastName
 *     }
 *   }
 * `
 * 
 * const field = {
 *   key: 'selectedUser',
 *   type: FormFieldType.SearchSelect,
 *   options: {
 *     label: 'Select User',
 *     required: true,
 *     document: SEARCH_USERS_QUERY,
 *     dataType: 'users',
 *     selectOptionsFunction: (users) => 
 *       users.map(user => ({
 *         value: user.id,
 *         label: user.name || `${user.firstName} ${user.lastName}`
 *       })),
 *     filter: (users) => users.slice(0, 10),
 *   },
 * }
 * ```
 * 
 * ## Features:
 * - **Debounced Search**: 500ms delay to prevent excessive API calls
 * - **Custom Data Mapping**: Transform GraphQL results into options
 * - **Filtering**: Client-side filtering of results
 * - **Read-only Modes**: Support for both value and disabled read-only styles
 * - **Error Handling**: Proper error state styling
 * - **Accessibility**: Full keyboard navigation and screen reader support
 */
const meta: Meta = {
  title: 'Forms/SearchSelectField',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The SearchSelectField component integrates with Apollo GraphQL to provide a searchable dropdown interface.

**Apollo Client Setup Required**: This component uses \`useQuery\` from Apollo Client and requires your application to be wrapped with an \`ApolloProvider\`.

**Key Props:**
- \`document\`: GraphQL query document
- \`dataType\`: Key in the query result containing the array of items
- \`selectOptionsFunction\`: Function to transform data items into \`{ value, label }\` options
- \`filter\`: Optional function to filter results client-side

**Theming**: Fully integrated with the centralized theme system, supporting all standard form field states including error, disabled, and read-only modes.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Documentation: Story = {
  name: '📚 Documentation & Usage',
  render: () => (
    <div className="max-w-2xl p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">SearchSelectField Component</h3>
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium mb-2">Apollo Client Integration</h4>
          <p className="text-gray-700">
            This component requires Apollo Client to be properly configured in your application.
            It uses the <code className="bg-gray-200 px-1 rounded">useQuery</code> hook to fetch searchable data.
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Key Features</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Debounced search (500ms delay)</li>
            <li>Custom data transformation via <code className="bg-gray-200 px-1 rounded">selectOptionsFunction</code></li>
            <li>Client-side filtering with <code className="bg-gray-200 px-1 rounded">filter</code> function</li>
            <li>Read-only modes (value display or disabled input)</li>
            <li>Full theme integration with error states</li>
            <li>Accessibility support with keyboard navigation</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-2">Required Props</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li><code className="bg-gray-200 px-1 rounded">document</code>: GraphQL query document</li>
            <li><code className="bg-gray-200 px-1 rounded">dataType</code>: Key in query result containing the array</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-2">Theme Properties</h4>
          <p className="text-gray-700">
            The component uses <code className="bg-gray-200 px-1 rounded">theme.searchSelectField</code> with properties for:
            input, dropdown, options, loading states, error states, and read-only modes.
          </p>
        </div>
      </div>
    </div>
  ),
}

export const ThemeStructure: Story = {
  name: '🎨 Theme Structure',
  render: () => (
    <div className="max-w-4xl p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">SearchSelectField Theme Properties</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-medium mb-2">Input & Container</h4>
          <ul className="space-y-1 text-gray-700">
            <li><code className="bg-gray-200 px-1 rounded">wrapper</code> - Outer wrapper</li>
            <li><code className="bg-gray-200 px-1 rounded">container</code> - Relative container</li>
            <li><code className="bg-gray-200 px-1 rounded">input</code> - ComboboxInput styling</li>
            <li><code className="bg-gray-200 px-1 rounded">button</code> - Dropdown button</li>
            <li><code className="bg-gray-200 px-1 rounded">buttonIcon</code> - Dropdown arrow icon</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Dropdown & Options</h4>
          <ul className="space-y-1 text-gray-700">
            <li><code className="bg-gray-200 px-1 rounded">dropdown</code> - ComboboxOptions container</li>
            <li><code className="bg-gray-200 px-1 rounded">option</code> - Individual option</li>
            <li><code className="bg-gray-200 px-1 rounded">optionActive</code> - Hovered/focused option</li>
            <li><code className="bg-gray-200 px-1 rounded">optionSelected</code> - Selected option</li>
            <li><code className="bg-gray-200 px-1 rounded">optionLabel</code> - Option text</li>
            <li><code className="bg-gray-200 px-1 rounded">optionCheckIcon</code> - Selected check icon</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">States</h4>
          <ul className="space-y-1 text-gray-700">
            <li><code className="bg-gray-200 px-1 rounded">loadingText</code> - Loading state text</li>
            <li><code className="bg-gray-200 px-1 rounded">error</code> - Error state styling</li>
            <li><code className="bg-gray-200 px-1 rounded">disabled</code> - Disabled state</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Read-only Modes</h4>
          <ul className="space-y-1 text-gray-700">
            <li><code className="bg-gray-200 px-1 rounded">readOnly</code> - Read-only base</li>
            <li><code className="bg-gray-200 px-1 rounded">readOnlyInput</code> - Disabled input style</li>
            <li><code className="bg-gray-200 px-1 rounded">readOnlyValue</code> - Value display style</li>
          </ul>
        </div>
      </div>
    </div>
  ),
}

export const IntegrationExample: Story = {
  name: '⚙️ Integration Example',
  render: () => (
    <div className="max-w-4xl p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Complete Integration Example</h3>
      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { gql } from '@apollo/client'
import { Form } from '@nestledjs/forms'
import { FormFieldType } from '@nestledjs/forms'

// 1. Define your GraphQL query
const SEARCH_USERS_QUERY = gql\`
  query SearchUsers($input: SearchInput) {
    users(input: $input) {
      id
      name
      firstName
      lastName
      email
    }
  }
\`

// 2. Create your form field configuration
const searchSelectField = {
  key: 'selectedUser',
  type: FormFieldType.SearchSelect,
  options: {
    label: 'Select User',
    required: true,
    helpText: 'Start typing to search for users',
    
    // Apollo integration
    document: SEARCH_USERS_QUERY,
    dataType: 'users', // Key in the query result
    
    // Transform data into options
    selectOptionsFunction: (users) => 
      users.map(user => ({
        value: user.id,
        label: user.name || \`\${user.firstName} \${user.lastName}\`,
      })),
    
    // Optional: Filter results client-side
    filter: (users) => users.slice(0, 10),
  },
}

// 3. Use in your form
export function MyForm() {
  return (
    <Form
      fields={[searchSelectField]}
      onSubmit={(data) => console.log(data)}
    />
  )
}`}
      </pre>
    </div>
  ),
} 