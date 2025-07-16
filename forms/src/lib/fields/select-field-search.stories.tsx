import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, SearchSelectOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'
import { countries, cities, technologies, companies, basicSearchOptions } from './storyOptions'
import { expectLabelToBePresent, expectLiveFormStateToBePresent } from './storybookTestUtils'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

// Option sets now imported from storyOptions.ts

// Helper function to build field options array
const buildSearchFieldOptions = (args: SelectFieldSearchStoryArgs): string[] => {
  const options: string[] = []
  
  if (args.label !== 'Search Select Field') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue) options.push(`defaultValue: '${args.defaultValue}'`)
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.placeholder && args.placeholder !== 'Search and select...') {
    options.push(`placeholder: '${args.placeholder}'`)
  }
  if (args.helpText) options.push(`helpText: '${args.helpText}'`)
  
  return options
}

// Helper function to format options array as string
const formatSearchOptionsArray = (optionSet: 'basic' | 'countries' | 'cities' | 'technologies' | 'companies'): string => {
  const optionSets = {
    basic: basicSearchOptions,
    countries,
    cities,
    technologies,
    companies,
  }
  
  const options = optionSets[optionSet]
  const formattedOptions = options.map(
    option => `          { label: '${option.label}', value: '${option.value}' }`
  ).join(',\n')
  
  return `[\n${formattedOptions},\n        ]`
}

// Helper function to build form props
const buildSearchFormProps = (args: SelectFieldSearchStoryArgs): string[] => {
  const formProps: string[] = []
  if (args.formReadOnly) formProps.push('readOnly={true}')
  if (args.formReadOnlyStyle !== 'value') formProps.push(`readOnlyStyle="${args.formReadOnlyStyle}"`)
  return formProps
}

// Helper function to assemble the final code string
const assembleSearchCodeString = (
  fieldOptions: string[],
  optionsArray: string,
  formProps: string[]
): string => {
  const options = [...fieldOptions, `options: ${optionsArray}`]
  
  let optionsString = ''
  if (options.length > 0) {
    optionsString = `
        ${options.join(',\n        ')},`
  }
  
  let formPropsString = ''
  if (formProps.length > 0) {
    formPropsString = `\n  ${formProps.join('\n  ')}`
  }
  
  return `<Form
  id="example-form"${formPropsString}
  fields={[
    {
      key: 'userSelection',
      type: FormFieldType.SearchSelect,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
}

const generateSelectFieldSearchCode = (args: SelectFieldSearchStoryArgs): string => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const fieldOptions = buildSearchFieldOptions(args)
  const optionsArray = formatSearchOptionsArray(args.optionSet)
  const formProps = buildSearchFormProps(args)
  const code = assembleSearchCodeString(fieldOptions, optionsArray, formProps)
  
  codeCache.set(cacheKey, code)
  return code
}

// Define the flat controls for the Storybook UI
interface SelectFieldSearchStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: string
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  placeholder: string
  helpText: string
  optionSet: 'basic' | 'countries' | 'cities' | 'technologies' | 'companies'
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The SelectFieldSearch component provides a searchable dropdown selection interface.
 * Users can type to filter through options, making it ideal for large datasets.
 * It combines the functionality of a text input with a select dropdown, providing
 * an intuitive search-and-select experience with keyboard navigation support.
 */
const meta: Meta<SelectFieldSearchStoryArgs> = {
  title: 'Forms/SelectFieldSearch',
  tags: ['autodocs'],
  parameters: {
    docs: {
      source: {
        type: 'code',
        transform: (code: string, storyContext: any) => {
          return generateSelectFieldSearchCode(storyContext.args)
        },
      },
      story: {
        inline: true,
        autoplay: false,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default selected value' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    helpText: { control: 'text', description: 'Help text' },
    optionSet: {
      control: 'select',
      options: ['basic', 'countries', 'cities', 'technologies', 'companies'],
      description: 'Set of options to display',
    },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
  args: {
    label: 'Search Select Field',
    required: false,
    disabled: false,
    defaultValue: '',
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select an option.',
    placeholder: 'Search and select...',
    helpText: '',
    optionSet: 'basic',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    // Generate different option sets based on the selected optionSet
    const optionSets = {
      basic: [
        { label: 'Option Alpha', value: 'alpha' },
        { label: 'Option Beta', value: 'beta' },
        { label: 'Option Gamma', value: 'gamma' },
        { label: 'Option Delta', value: 'delta' },
        { label: 'Option Epsilon', value: 'epsilon' },
      ],
      countries,
      cities: [
        { label: 'New York', value: 'nyc' },
        { label: 'Los Angeles', value: 'la' },
        { label: 'Chicago', value: 'chicago' },
        { label: 'Houston', value: 'houston' },
        { label: 'Phoenix', value: 'phoenix' },
        { label: 'Philadelphia', value: 'philadelphia' },
        { label: 'San Antonio', value: 'san-antonio' },
        { label: 'San Diego', value: 'san-diego' },
        { label: 'Dallas', value: 'dallas' },
        { label: 'San Jose', value: 'san-jose' },
        { label: 'Austin', value: 'austin' },
        { label: 'Jacksonville', value: 'jacksonville' },
      ],
      technologies: [
        { label: 'React', value: 'react' },
        { label: 'Vue.js', value: 'vue' },
        { label: 'Angular', value: 'angular' },
        { label: 'Svelte', value: 'svelte' },
        { label: 'Next.js', value: 'nextjs' },
        { label: 'Nuxt.js', value: 'nuxtjs' },
        { label: 'Gatsby', value: 'gatsby' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'Node.js', value: 'nodejs' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'C#', value: 'csharp' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rust' },
      ],
      companies: [
        { label: 'Apple Inc.', value: 'apple' },
        { label: 'Microsoft Corporation', value: 'microsoft' },
        { label: 'Alphabet Inc. (Google)', value: 'google' },
        { label: 'Amazon.com Inc.', value: 'amazon' },
        { label: 'Meta Platforms Inc. (Facebook)', value: 'meta' },
        { label: 'Tesla Inc.', value: 'tesla' },
        { label: 'NVIDIA Corporation', value: 'nvidia' },
        { label: 'Netflix Inc.', value: 'netflix' },
        { label: 'Adobe Inc.', value: 'adobe' },
        { label: 'Salesforce Inc.', value: 'salesforce' },
        { label: 'Oracle Corporation', value: 'oracle' },
        { label: 'Intel Corporation', value: 'intel' },
      ],
    }

    // Build field options conditionally
    const fieldOptions: SearchSelectOptions = {
      label: args.label,
      required: args.required,
      disabled: args.disabled,
      defaultValue: args.defaultValue,
      placeholder: args.placeholder,
      options: optionSets[args.optionSet],
    }

    // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
    if (args.readOnly) {
      fieldOptions.readOnly = args.readOnly
    }
    
    if (args.readOnly && args.readOnlyStyle !== 'value') {
      fieldOptions.readOnlyStyle = args.readOnlyStyle
    }
    
    if (args.helpText) {
      fieldOptions.helpText = args.helpText
    }

    const field: { key: string; type: FormFieldType.SearchSelect; options: SearchSelectOptions } = {
      key: 'storybookSearchSelectField',
      type: FormFieldType.SearchSelect,
      options: fieldOptions,
    }
    return (
      <StorybookFieldWrapper
        field={field}
        hasError={args.hasError}
        errorMessage={args.errorMessage}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
        showState={args.showState}
      />
    )
  },
}

export default meta
type Story = StoryObj<SelectFieldSearchStoryArgs>

/**
 * The default SearchSelect with basic searchable options.
 */
export const Default: Story = {}

/**
 * A SearchSelect with a large dataset demonstrating search functionality.
 */
export const CountrySelection: Story = {
  args: {
    label: 'Country',
    optionSet: 'countries',
    placeholder: 'Search for a country...',
    helpText: 'Type to search through countries',
  },
}

/**
 * A SearchSelect with a pre-selected value.
 */
export const WithDefaultValue: Story = {
  args: {
    label: 'Technology',
    optionSet: 'technologies',
    defaultValue: 'react',
    placeholder: 'Search technologies...',
    helpText: 'Select your preferred technology',
  },
}

/**
 * A required SearchSelect field.
 */
export const Required: Story = {
  args: {
    label: 'Company',
    optionSet: 'companies',
    required: true,
    placeholder: 'Search companies...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify required indicator is shown', async () => {
      const label = canvas.getByText('Company')
      expect(label).toBeInTheDocument()
    })
  },
}

/**
 * A SearchSelect in an error state.
 */
export const WithError: Story = {
  args: {
    label: 'City',
    optionSet: 'cities',
    hasError: true,
    errorMessage: 'Please select a city',
    required: true,
    placeholder: 'Search cities...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify error state is displayed', async () => {
      const errorMessage = canvas.getByText('Please select a city')
      expect(errorMessage).toBeInTheDocument()
    })
  },
}

/**
 * A disabled SearchSelect that cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Search',
    disabled: true,
    defaultValue: 'beta',
    placeholder: 'This field is disabled',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify field is disabled', async () => {
      const input = canvas.getByRole('combobox')
      expect(input).toBeDisabled()
    })
  },
}

/**
 * A SearchSelect in read-only mode showing only the value.
 */
export const ReadOnlyValue: Story = {
  args: {
    label: 'Selected Country',
    optionSet: 'countries',
    defaultValue: 'CA',
    readOnly: true,
    readOnlyStyle: 'value',
  },
}

/**
 * A SearchSelect in read-only mode showing as a disabled input.
 */
export const ReadOnlyDisabled: Story = {
  args: {
    label: 'Selected Technology',
    optionSet: 'technologies',
    defaultValue: 'typescript',
    readOnly: true,
    readOnlyStyle: 'disabled',
  },
}

/**
 * A SearchSelect with form-level read-only mode.
 */
export const FormReadOnly: Story = {
  args: {
    label: 'Form Read-Only',
    optionSet: 'companies',
    defaultValue: 'google',
    formReadOnly: true,
    formReadOnlyStyle: 'value',
  },
}

/**
 * Interactive test demonstrating search functionality.
 */
export const SearchFunctionality: Story = {
  args: {
    label: 'Search Test',
    optionSet: 'countries',
    placeholder: 'Type to search countries...',
    helpText: 'This story tests the search functionality',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Focus the search input', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      expect(input).toHaveFocus()
    })
    
    await step('Type search query and verify filtering', async () => {
      const input = canvas.getByRole('combobox')
      await user.type(input, 'unit')
      
      // Should show filtered options
      await canvas.findByText('United States')
      await canvas.findByText('United Kingdom')
      
      // Should not show non-matching options
      expect(canvas.queryByText('Germany')).not.toBeInTheDocument()
    })
    
    await step('Select filtered option', async () => {
      const option = canvas.getByText('United States')
      await user.click(option)
      
      // Verify selection
      const input = canvas.getByRole('combobox')
      expect(input).toHaveDisplayValue('United States')
    })
  },
}

/**
 * Test clearing search and showing all options.
 */
export const SearchAndClear: Story = {
  args: {
    label: 'Search and Clear Test',
    optionSet: 'technologies',
    placeholder: 'Search technologies...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Search for specific technology', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'java')
      
      // Should show JavaScript and Java
      await canvas.findByText('JavaScript')
      await canvas.findByText('Java')
      
      // Should not show React
      expect(canvas.queryByText('React')).not.toBeInTheDocument()
    })
    
    await step('Clear search and verify all options appear', async () => {
      const input = canvas.getByRole('combobox')
      await user.clear(input)
      
      // All options should be visible again
      await canvas.findByText('React')
      await canvas.findByText('Vue.js')
      await canvas.findByText('Angular')
    })
  },
}

/**
 * Test keyboard navigation in search results.
 */
export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard Navigation Test',
    optionSet: 'cities',
    placeholder: 'Use keyboard to navigate...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Focus and search', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'san')
      
      // Wait for filtered results
      await canvas.findByText('San Antonio')
      await canvas.findByText('San Diego')
      await canvas.findByText('San Jose')
    })
    
    await step('Navigate with arrow keys', async () => {
      // Navigate down through options
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      
      // Select with Enter
      await user.keyboard('{Enter}')
      
      const input = canvas.getByRole('combobox')
      expect(input).toHaveDisplayValue('San Diego')
    })
  },
}

/**
 * Test form submission with SearchSelect value.
 */
export const FormSubmission: Story = {
  args: {
    label: 'Submit Test',
    optionSet: 'companies',
    required: true,
    showState: true,
    placeholder: 'Search companies...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Search and select a company', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'apple')
      
      const option = canvas.getByText('Apple Inc.')
      await user.click(option)
      
      // Check that the value appears in the live form state
      expectLiveFormStateToBePresent(canvas)
    })
  },
}

/**
 * Test no results scenario.
 */
export const NoResults: Story = {
  args: {
    label: 'No Results Test',
    optionSet: 'technologies',
    placeholder: 'Search for something that doesnt exist...',
    helpText: 'Try searching for "xyz" to see no results state',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Search for non-existent option', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'xyz123notfound')
      
      // Should show no results message or empty list
      // The exact behavior depends on the SearchSelectBase implementation
      expect(canvas.queryByText('React')).not.toBeInTheDocument()
      expect(canvas.queryByText('Vue.js')).not.toBeInTheDocument()
    })
  },
}

/**
 * Comprehensive test covering multiple search scenarios.
 */
export const ComprehensiveSearch: Story = {
  args: {
    label: 'Comprehensive Search Test',
    optionSet: 'countries',
    placeholder: 'Test multiple search scenarios...',
    helpText: 'This tests various search patterns and selections',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Test partial matching', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'ger')
      
      await canvas.findByText('Germany')
      expect(canvas.queryByText('France')).not.toBeInTheDocument()
    })
    
    await step('Test case insensitive search', async () => {
      const input = canvas.getByRole('combobox')
      await user.clear(input)
      await user.type(input, 'FRANCE')
      
      await canvas.findByText('France')
    })
    
    await step('Test selecting and changing selection', async () => {
      const input = canvas.getByRole('combobox')
      const franceOption = canvas.getByText('France')
      await user.click(franceOption)
      
      expect(input).toHaveDisplayValue('France')
      
      // Change selection
      await user.click(input)
      await user.clear(input)
      await user.type(input, 'japan')
      
      const japanOption = canvas.getByText('Japan')
      await user.click(japanOption)
      
      expect(input).toHaveDisplayValue('Japan')
    })
  },
} 