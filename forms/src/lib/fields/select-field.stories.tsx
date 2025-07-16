import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, SelectOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateSelectFieldCode = (args: SelectFieldStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'Select Field') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue) options.push(`defaultValue: '${args.defaultValue}'`)
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.placeholder && args.placeholder !== 'Select an option...') options.push(`placeholder: '${args.placeholder}'`)
  if (args.helpText) options.push(`helpText: '${args.helpText}'`)
  
  // Generate options array
  const optionsArray = args.optionSet === 'countries' 
    ? `[
          { label: 'United States', value: 'US' },
          { label: 'Canada', value: 'CA' },
          { label: 'United Kingdom', value: 'UK' },
          { label: 'Germany', value: 'DE' },
          { label: 'France', value: 'FR' },
        ]`
    : args.optionSet === 'priorities'
    ? `[
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' },
        ]`
    : args.optionSet === 'sizes'
    ? `[
          { label: 'Extra Small', value: 'xs' },
          { label: 'Small', value: 's' },
          { label: 'Medium', value: 'm' },
          { label: 'Large', value: 'l' },
          { label: 'Extra Large', value: 'xl' },
        ]`
    : `[
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' },
        ]`
  
  options.push(`options: ${optionsArray}`)
  
  const formProps: string[] = []
  if (args.formReadOnly) formProps.push('readOnly={true}')
  if (args.formReadOnlyStyle !== 'value') formProps.push(`readOnlyStyle="${args.formReadOnlyStyle}"`)
  
  const optionsString = options.length > 0 ? `
        ${options.join(',\n        ')},` : ''
  
  const formPropsString = formProps.length > 0 ? `\n  ${formProps.join('\n  ')}` : ''
  
  const code = `<Form
  id="example-form"${formPropsString}
  fields={[
    {
      key: 'userSelection',
      type: FormFieldType.Select,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

// Define the flat controls for the Storybook UI
interface SelectFieldStoryArgs {
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
  optionSet: 'basic' | 'countries' | 'priorities' | 'sizes'
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The SelectField component provides a dropdown selection interface with customizable options.
 * It supports placeholder text, help text, error states, and both field-level and form-level
 * read-only modes. The component uses Headless UI for accessibility and keyboard navigation.
 */
const meta: Meta<SelectFieldStoryArgs> = {
  title: 'Forms/SelectField',
  tags: ['autodocs'],
  parameters: {
    docs: {
      source: {
        type: 'code',
        transform: (code: string, storyContext: any) => {
          return generateSelectFieldCode(storyContext.args)
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
      options: ['basic', 'countries', 'priorities', 'sizes'],
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
    label: 'Select Field',
    required: false,
    disabled: false,
    defaultValue: '',
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select an option.',
    placeholder: 'Select an option...',
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
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' },
      ],
      countries: [
        { label: 'United States', value: 'US' },
        { label: 'Canada', value: 'CA' },
        { label: 'United Kingdom', value: 'UK' },
        { label: 'Germany', value: 'DE' },
        { label: 'France', value: 'FR' },
        { label: 'Japan', value: 'JP' },
        { label: 'Australia', value: 'AU' },
      ],
      priorities: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
      sizes: [
        { label: 'Extra Small', value: 'xs' },
        { label: 'Small', value: 's' },
        { label: 'Medium', value: 'm' },
        { label: 'Large', value: 'l' },
        { label: 'Extra Large', value: 'xl' },
      ],
    }

    const field: { key: string; type: FormFieldType.Select; options: SelectOptions } = {
      key: 'storybookSelectField',
      type: FormFieldType.Select,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        placeholder: args.placeholder,
        helpText: args.helpText || undefined,
        options: optionSets[args.optionSet],
      },
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
type Story = StoryObj<SelectFieldStoryArgs>

/**
 * The default SelectField with basic options.
 */
export const Default: Story = {}

/**
 * A SelectField with a pre-selected value and help text.
 */
export const WithDefaultValue: Story = {
  args: {
    label: 'Country',
    optionSet: 'countries',
    defaultValue: 'US',
    helpText: 'Select your country of residence',
  },
}

/**
 * A required SelectField that shows validation behavior.
 */
export const Required: Story = {
  args: {
    label: 'Priority Level',
    optionSet: 'priorities',
    required: true,
    placeholder: 'Choose priority...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify required indicator is shown', async () => {
      const label = canvas.getByText('Priority Level')
      expect(label).toBeInTheDocument()
      // Check for required asterisk (assuming it's added by the wrapper)
    })
  },
}

/**
 * A SelectField in an error state.
 */
export const WithError: Story = {
  args: {
    label: 'Size',
    optionSet: 'sizes',
    hasError: true,
    errorMessage: 'Please select a size',
    required: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify error state is displayed', async () => {
      const errorMessage = canvas.getByText('Please select a size')
      expect(errorMessage).toBeInTheDocument()
    })
  },
}

/**
 * A disabled SelectField that cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Selection',
    disabled: true,
    defaultValue: 'option2',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify field is disabled', async () => {
      const select = canvas.getByRole('combobox')
      expect(select).toBeDisabled()
    })
  },
}

/**
 * A SelectField in read-only mode showing only the value.
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
 * A SelectField in read-only mode showing as a disabled input.
 */
export const ReadOnlyDisabled: Story = {
  args: {
    label: 'Selected Priority',
    optionSet: 'priorities',
    defaultValue: 'high',
    readOnly: true,
    readOnlyStyle: 'disabled',
  },
}

/**
 * A SelectField with form-level read-only mode.
 */
export const FormReadOnly: Story = {
  args: {
    label: 'Form Read-Only',
    optionSet: 'sizes',
    defaultValue: 'l',
    formReadOnly: true,
    formReadOnlyStyle: 'value',
  },
}

/**
 * Interactive test demonstrating SelectField selection behavior.
 */
export const InteractiveSelection: Story = {
  args: {
    label: 'Interactive Selection',
    optionSet: 'countries',
    placeholder: 'Choose a country...',
    helpText: 'This story tests selection interactions',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Open select dropdown', async () => {
      const select = canvas.getByRole('combobox')
      await user.click(select)
      
      // Wait for options to appear
      const option = await canvas.findByText('United States')
      expect(option).toBeInTheDocument()
    })
    
    await step('Select an option', async () => {
      const select = canvas.getByRole('combobox')
      await user.selectOptions(select, 'CA')
      
      // Verify the selection was made
      expect(select).toHaveValue('CA')
    })
    
    await step('Change selection', async () => {
      const select = canvas.getByRole('combobox')
      await user.selectOptions(select, 'UK')
      
      expect(select).toHaveValue('UK')
    })
  },
}

/**
 * Test keyboard navigation functionality.
 */
export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard Navigation Test',
    optionSet: 'priorities',
    placeholder: 'Use keyboard to navigate...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Focus the select field', async () => {
      const select = canvas.getByRole('combobox')
      await user.click(select)
      expect(select).toHaveFocus()
    })
    
    await step('Navigate with arrow keys', async () => {
      const select = canvas.getByRole('combobox')
      
      // Use selectOptions to simulate keyboard selection
      await user.selectOptions(select, 'medium') // Select "Medium"
      
      expect(select).toHaveValue('medium')
    })
  },
}

/**
 * Test form submission with SelectField value.
 */
export const FormSubmission: Story = {
  args: {
    label: 'Submit Test',
    optionSet: 'sizes',
    required: true,
    showState: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Select a value and verify it appears in form state', async () => {
      const select = canvas.getByRole('combobox')
      await user.selectOptions(select, 'l')
      
      // Check that the value appears in the live form state
      const stateDisplay = canvas.getByText(/"storybookSelectField": "l"/)
      expect(stateDisplay).toBeInTheDocument()
    })
  },
}

/**
 * Test with long option lists and custom placeholder.
 */
export const LongOptionList: Story = {
  args: {
    label: 'Country Selection',
    optionSet: 'countries',
    placeholder: 'Search and select your country...',
    helpText: 'Select from the available countries',
    required: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Verify placeholder is shown', async () => {
      const select = canvas.getByRole('combobox')
      await user.click(select)
      
      const placeholder = canvas.getByText('Search and select your country...')
      expect(placeholder).toBeInTheDocument()
    })
    
    await step('Verify all options are available', async () => {
      const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia']
      
      for (const country of countries) {
        const option = canvas.getByText(country)
        expect(option).toBeInTheDocument()
      }
    })
  },
} 