import type { Meta, StoryObj } from '@storybook/react'

/**
 * The SelectFieldSearchApollo component provides a searchable dropdown with Apollo GraphQL integration.
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
 *   type: FormFieldType.SearchSelectApollo,
 *   options: {
 *     label: 'Select User',
 *     required: true,
 *     document: SEARCH_USERS_QUERY,
 *     dataType: 'users',
 *     searchFields: ['name', 'firstName', 'lastName', 'email'],
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
  title: 'Forms/SelectFieldSearchApollo',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The SelectFieldSearchApollo component integrates with Apollo GraphQL to provide a searchable dropdown interface.

**Apollo Client Setup Required**: This component uses \`useQuery\` from Apollo Client and requires your application to be wrapped with an \`ApolloProvider\`.

**Key Props:**
- \`document\`: GraphQL query document
- \`dataType\`: Key in the query result containing the array of items
- \`searchFields\`: Array of field names to search (e.g., ['name', 'email', 'firstName'])
- \`selectOptionsFunction\`: Function to transform data items into \`{ value, label }\` options
- \`filter\`: Optional function to filter results client-side

**Theming**: Fully integrated with the centralized theme system, supporting all standard form field states including error, disabled, and read-only modes.

**Differences from Basic Version:**
- **Server-side Search**: Queries are sent to your GraphQL API
- **Dynamic Data**: Loads fresh data from your backend
- **Custom Mapping**: Transform API responses to match your UI needs
- **Pre-filtering**: Filter data before mapping to options
- **Loading States**: Built-in loading indicators during API calls
- **Scalable**: Handles large datasets with server-side search

**When to Use This Version:**
- Large datasets that require server-side search
- Dynamic data that changes frequently  
- When you need real-time search results
- Complex filtering or sorting requirements
- Applications already using Apollo Client
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
      <h3 className="text-lg font-semibold mb-4">SelectFieldSearchApollo Component</h3>
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium mb-2">Apollo Client Integration</h4>
          <p className="text-gray-700">
            This component requires Apollo Client to be properly configured in your application.
            It uses the <code className="bg-gray-200 px-1 rounded">useQuery</code> hook to fetch searchable data from your GraphQL API.
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Key Features</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Server-side debounced search (500ms delay)</li>
            <li>Custom data transformation via <code className="bg-gray-200 px-1 rounded">selectOptionsFunction</code></li>
            <li>Client-side filtering with <code className="bg-gray-200 px-1 rounded">filter</code> function</li>
            <li>GraphQL query integration with <code className="bg-gray-200 px-1 rounded">document</code> prop</li>
            <li>Loading states during API calls</li>
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
          <h4 className="font-medium mb-2">Optional Props</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li><code className="bg-gray-200 px-1 rounded">selectOptionsFunction</code>: Custom data mapping function</li>
            <li><code className="bg-gray-200 px-1 rounded">filter</code>: Client-side filtering function</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-900">Consider the Basic Version</h4>
          <p className="text-blue-800 text-sm">
            If you don't need GraphQL integration and have a static list of options, 
            consider using <code className="bg-blue-200 px-1 rounded">SelectFieldSearch</code> for simpler client-side filtering.
          </p>
        </div>
      </div>
    </div>
  ),
}

export const IntegrationExample: Story = {
  name: '⚙️ Integration Example',
  render: () => (
    <div className="max-w-4xl p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Complete Apollo Integration Example</h3>
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
  type: FormFieldType.SearchSelectApollo,
  options: {
    label: 'Select User',
    required: true,
    helpText: 'Start typing to search for users',
    
    // Apollo integration
    document: SEARCH_USERS_QUERY,
    dataType: 'users', // Key in the query result
    searchFields: ['name', 'firstName', 'lastName', 'email'], // Fields to search
    
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

export const QueryConfiguration: Story = {
  name: '🔧 Query Configuration',
  render: () => (
    <div className="max-w-4xl p-6 bg-gray-50 rounded-lg space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">GraphQL Query Setup</h3>
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          <pre>{`// Basic query structure
const SEARCH_QUERY = gql\`
  query SearchItems($input: SearchInput) {
    items(input: $input) {  # <- This is your 'dataType'
      id                    # <- Required for default mapping
      name                  # <- Required for default mapping
      # ... other fields
    }
  }
\`

// Advanced query with custom fields
const SEARCH_USERS_QUERY = gql\`
  query SearchUsers($input: SearchInput) {
    users(input: $input) {  # <- dataType: 'users'
      id
      firstName
      lastName
      email
      department {
        name
      }
    }
  }
\``}</pre>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Custom Option Mapping</h4>
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          <pre>{`// Custom selectOptionsFunction examples
const field = {
  // ... other options
  selectOptionsFunction: (users) => users.map(user => ({
    value: user.id,
    label: \`\${user.firstName} \${user.lastName} (\${user.email})\`
  })),
  
  // With department info
  selectOptionsFunction: (users) => users.map(user => ({
    value: user.id,
    label: \`\${user.firstName} \${user.lastName}\`,
    subtitle: user.department?.name || 'No Department'
  })),
  
  // With filtering
  filter: (users) => users.filter(user => user.active),
}`}</pre>
        </div>
      </div>
    </div>
  ),
}

export const ThemeStructure: Story = {
  name: '🎨 Theme Structure',
  render: () => (
    <div className="max-w-4xl p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">SelectFieldSearchApollo Theme Properties</h3>
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
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Uses the same theme properties as <code>SelectFieldSearch</code> 
          under <code>theme.searchSelectField</code> for consistency.
        </p>
      </div>
    </div>
  ),
} 