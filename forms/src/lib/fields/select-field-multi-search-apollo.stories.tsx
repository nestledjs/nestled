import type { Meta, StoryObj } from '@storybook/react'

/**
 * The SelectFieldMultiSearchApollo component provides a multi-select searchable dropdown with Apollo GraphQL integration.
 * It supports debounced search, custom data mapping, filtering, and multiple selection with tag-based UI.
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
 *   key: 'selectedUsers',
 *   type: FormFieldType.SearchSelectMultiApollo,
 *   options: {
 *     label: 'Select Users',
 *     document: SEARCH_USERS_QUERY,
 *     dataType: 'users',
 *     searchFields: ['name', 'firstName', 'lastName', 'email'],
 *     selectOptionsFunction: (users) => users.map(user => ({ 
 *       value: user.id, 
 *       label: user.name || `${user.firstName} ${user.lastName}` 
 *     }))
 *   }
 * }
 * ```
 * 
 * ## Key Features:
 * - **Multi-selection**: Users can select multiple items displayed as removable tags
 * - **Debounced Search**: Search input is debounced to reduce API calls
 * - **Apollo Integration**: Uses Apollo Client for GraphQL queries
 * - **Custom Data Mapping**: Supports custom functions to map API data to select options
 * - **Filtering**: Optional filter function to pre-process data before mapping
 * - **Loading States**: Shows loading indicator during searches
 * - **Accessibility**: Built with Headless UI for full accessibility support
 * - **Read-only Support**: Can be rendered as plain text or disabled input
 * 
 * ## Required GraphQL Query Variables:
 * Your GraphQL query should accept an `input` parameter with a `search` field:
 * ```graphql
 * query SearchItems($input: SearchInput) {
 *   items(input: $input) {
 *     id
 *     name
 *   }
 * }
 * ```
 */
const meta: Meta = {
  title: 'Forms/SelectFieldMultiSearchApollo',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A multi-select searchable dropdown component that integrates with Apollo GraphQL for dynamic data loading.

### Field Configuration

\`\`\`typescript
{
  key: 'fieldKey',
  type: FormFieldType.SearchSelectMultiApollo,
  options: {
    label: 'Field Label',
    document: GRAPHQL_QUERY,      // Apollo GraphQL query
    dataType: 'queryResultKey',   // Key in query result
    searchFields: ['name', 'email'], // Fields to search
    selectOptionsFunction: (data) => data.map(item => ({
      value: item.id,
      label: item.name
    })),
    filter: (data) => data.filter(item => item.active), // Optional
    defaultValue: [],             // Default selected items
    required: true,               // Optional
    disabled: false,              // Optional
    readOnly: false,              // Optional
    readOnlyStyle: 'value'        // 'value' | 'disabled'
  }
}
\`\`\`

### Apollo Client Setup Required

This component requires Apollo Client to be configured in your application. The stories below are for documentation only and cannot be fully interactive without proper Apollo setup.

### Differences from Basic Version

- **Server-side Search**: Queries are sent to your GraphQL API
- **Dynamic Data**: Loads fresh data from your backend
- **Custom Mapping**: Transform API responses to match your UI needs
- **Pre-filtering**: Filter data before mapping to options
- **Loading States**: Built-in loading indicators during API calls
- **Scalable**: Handles large datasets with server-side search

### When to Use

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

export const Overview: Story = {
  name: 'Overview',
  parameters: {
    docs: {
      source: {
        code: `
// Example field configuration
const field = {
  key: 'selectedUsers',
  type: FormFieldType.SearchSelectMultiApollo,
  options: {
    label: 'Select Team Members',
    document: SEARCH_USERS_QUERY,
    dataType: 'users',
    selectOptionsFunction: (users) => users.map(user => ({
      value: user.id,
      label: \`\${user.firstName} \${user.lastName}\`
    })),
    filter: (users) => users.filter(user => user.active),
    defaultValue: [],
    required: true
  }
}

// GraphQL Query
const SEARCH_USERS_QUERY = gql\`
  query SearchUsers($input: SearchInput) {
    users(input: $input) {
      id
      firstName
      lastName
      email
      active
    }
  }
\`
        `,
        language: 'tsx',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">SelectFieldMultiSearchApollo</h3>
      <p className="text-gray-600">
        A multi-select searchable dropdown component that integrates with Apollo GraphQL for dynamic data loading.
      </p>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> This component requires Apollo Client configuration. 
          The interactive examples cannot be fully demonstrated in Storybook without proper Apollo mocking.
        </p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Consider the basic version:</strong> If you don't need GraphQL integration, 
          use <code>SelectFieldMultiSearch</code> for simpler client-side filtering.
        </p>
      </div>
    </div>
  ),
}

export const BasicConfiguration: Story = {
  name: 'Basic Configuration',
  parameters: {
    docs: {
      source: {
        code: `
const field = {
  key: 'selectedItems',
  type: FormFieldType.SearchSelectMultiApollo,
  options: {
    label: 'Select Items',
    document: SEARCH_ITEMS_QUERY,
    dataType: 'items'
  }
}
        `,
        language: 'tsx',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <h4 className="font-semibold">Minimal Configuration</h4>
      <p className="text-sm text-gray-600">
        The simplest setup requires only the GraphQL query document and the data type key.
        Uses default option mapping (id → value, name → label).
      </p>
    </div>
  ),
}

export const WithCustomMapping: Story = {
  name: 'With Custom Mapping',
  parameters: {
    docs: {
      source: {
        code: `
const field = {
  key: 'selectedUsers',
  type: FormFieldType.SearchSelectMultiApollo,
  options: {
    label: 'Select Users',
    document: SEARCH_USERS_QUERY,
    dataType: 'users',
    selectOptionsFunction: (users) => users.map(user => ({
      value: user.id,
      label: \`\${user.firstName} \${user.lastName} (\${user.email})\`
    })),
    filter: (users) => users.filter(user => user.active && user.role !== 'admin')
  }
}
        `,
        language: 'tsx',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <h4 className="font-semibold">Custom Data Mapping and Filtering</h4>
      <p className="text-sm text-gray-600">
        Use custom functions to map API data to select options and filter results before mapping.
      </p>
    </div>
  ),
}

export const ReadOnlyStates: Story = {
  name: 'Read-Only States',
  parameters: {
    docs: {
      source: {
        code: `
// Read-only as plain text
const readOnlyField = {
  key: 'selectedItems',
  type: FormFieldType.SearchSelectMultiApollo,
  options: {
    label: 'Selected Items',
    document: SEARCH_ITEMS_QUERY,
    dataType: 'items',
    readOnly: true,
    readOnlyStyle: 'value'
  }
}

// Read-only as disabled input
const disabledField = {
  key: 'selectedItems',
  type: FormFieldType.SearchSelectMultiApollo,
  options: {
    label: 'Selected Items',
    document: SEARCH_ITEMS_QUERY,
    dataType: 'items',
    readOnly: true,
    readOnlyStyle: 'disabled'
  }
}
        `,
        language: 'tsx',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <h4 className="font-semibold">Read-Only Display Options</h4>
      <p className="text-sm text-gray-600">
        Choose between plain text display or disabled input styling for read-only states.
      </p>
    </div>
  ),
}

export const APIRequirements: Story = {
  name: 'API Requirements',
  parameters: {
    docs: {
      source: {
        code: `
// Your GraphQL query must accept input with search parameter
const SEARCH_QUERY = gql\`
  query SearchItems($input: SearchInput) {
    items(input: $input) {
      id
      name
      description
      active
    }
  }
\`

// SearchInput type should include:
type SearchInput = {
  search?: string
  limit?: number
  offset?: number
}

// API response should return searchable data
{
  "data": {
    "items": [
      {
        "id": "1",
        "name": "Item 1",
        "description": "Description",
        "active": true
      }
    ]
  }
}
        `,
        language: 'tsx',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <h4 className="font-semibold">GraphQL API Requirements</h4>
      <p className="text-sm text-gray-600">
        Your GraphQL API must support search input parameters and return structured data.
      </p>
    </div>
  ),
}

export const ComparisonWithBasicVersion: Story = {
  name: 'Comparison with Basic Version',
  render: () => (
    <div className="max-w-4xl mx-auto p-6">
      <h3 className="text-xl font-bold mb-6">Apollo vs Basic Version</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-green-700 mb-3">SelectFieldMultiSearchApollo</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Server-side search with GraphQL</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Handles large datasets efficiently</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Real-time data from API</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Custom data transformation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Loading states and error handling</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-1">⚠</span>
              <span>Requires Apollo Client setup</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-1">⚠</span>
              <span>More complex configuration</span>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-blue-700 mb-3">SelectFieldMultiSearch</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Client-side filtering</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>No external dependencies</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Simple setup with options array</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Immediate search results</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Works offline</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">⚠</span>
              <span>Limited to smaller datasets</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">⚠</span>
              <span>Static data only</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium mb-2">Recommendation:</h5>
        <p className="text-sm text-gray-700">
          Use <strong>SelectFieldMultiSearchApollo</strong> when you need server-side search, large datasets, 
          or dynamic data. Use <strong>SelectFieldMultiSearch</strong> for simpler use cases with 
          pre-loaded options and no GraphQL requirements.
        </p>
      </div>
    </div>
  ),
} 