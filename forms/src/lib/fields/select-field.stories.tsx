import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface SelectFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue?: string
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  helpText?: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
  // Select-specific options
  fieldType: 'select' | 'enum'
  customOptions: string
}

/**
 * The SelectField component provides a dropdown selection interface using Headless UI Combobox.
 * It supports both regular Select fields with custom options and EnumSelect fields that auto-generate options from an enum.
 */
const meta: Meta<SelectFieldStoryArgs> = {
  title: 'Forms/SelectField',
  tags: ['autodocs'],
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
    helpText: { control: 'text', description: 'Help text' },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
    fieldType: {
      control: 'radio',
      options: ['select', 'enum'],
      description: 'Type of select field',
    },
    customOptions: {
      control: 'text',
      description: 'Custom options (JSON format)',
    },
  },
  args: {
    label: 'Select Option',
    required: false,
    disabled: false,
    defaultValue: undefined,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select a valid option.',
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
    fieldType: 'select',
    customOptions: '["Option 1", "Option 2", "Option 3", "Option 4"]',
  },
  render: (args) => {
    // Parse custom options
    let options: { label: string; value: string }[] = []
    try {
      const parsedOptions = JSON.parse(args.customOptions)
      options = parsedOptions.map((opt: string, index: number) => ({
        label: opt,
        value: `option-${index + 1}`,
      }))
    } catch {
      options = [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
        { label: 'Option 3', value: 'option-3' },
      ]
    }

    const field = args.fieldType === 'enum' 
      ? {
          key: 'storybookSelectField' as const,
          type: FormFieldType.EnumSelect as const,
          options: {
            label: args.label,
            required: args.required,
            disabled: args.disabled,
            defaultValue: args.defaultValue,
            ...(args.readOnly && { readOnly: args.readOnly }),
            ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
            helpText: args.helpText,
            enum: {
              'Option A': 'option-a',
              'Option B': 'option-b',
              'Option C': 'option-c',
            },
          },
        }
      : {
          key: 'storybookSelectField' as const,
          type: FormFieldType.Select as const,
          options: {
            label: args.label,
            required: args.required,
            disabled: args.disabled,
            defaultValue: args.defaultValue,
            ...(args.readOnly && { readOnly: args.readOnly }),
            ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
            helpText: args.helpText,
            options,
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default State',
  args: { showState: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Select Option' })
    await expect(input).toBeInTheDocument()
    await expect(input).toBeEnabled()
    
    // Test opening the dropdown
    await userEvent.click(input)
    
    // Check if options appear
    const option1 = canvas.getByText('Option 1')
    await expect(option1).toBeInTheDocument()
    
    // Select an option
    await userEvent.click(option1)
    await expect(input).toHaveValue('Option 1')
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'option-2',
    label: 'Pre-selected Option',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Pre-selected Option' })
    await expect(input).toHaveValue('Option 2')
  },
}

export const Required: Story = {
  args: {
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Select Option *' })
    await expect(input).toBeRequired()
    
    // Test selection
    await userEvent.click(input)
    const option3 = canvas.getByText('Option 3')
    await userEvent.click(option3)
    await expect(input).toHaveValue('Option 3')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'option-1',
    label: 'Disabled Select',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Disabled Select' })
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('Option 1')
    
    // Verify dropdown doesn't open when disabled
    await userEvent.click(input)
    const option2 = canvas.queryByText('Option 2')
    await expect(option2).not.toBeInTheDocument()
  },
}

export const Error: Story = {
  args: {
    required: true,
    hasError: true,
    label: 'Select with Error',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Select with Error *' })
    await expect(input).toBeRequired()
    
    // Test that user can still interact with field in error state
    await userEvent.click(input)
    const option4 = canvas.getByText('Option 4')
    await userEvent.click(option4)
    await expect(input).toHaveValue('Option 4')
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Choose the best option for your needs',
    label: 'Select with Help',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Select with Help' })
    const helpText = canvas.getByText('Choose the best option for your needs')
    
    await expect(input).toBeInTheDocument()
    await expect(helpText).toBeInTheDocument()
    
    // Test functionality
    await userEvent.click(input)
    const option2 = canvas.getByText('Option 2')
    await userEvent.click(option2)
    await expect(input).toHaveValue('Option 2')
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 'option-3',
    label: 'Read-only Select',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as a div, not an input
    const valueDisplay = canvas.getByText('Option 3')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive combobox
    const input = canvas.queryByRole('combobox')
    await expect(input).not.toBeInTheDocument()
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: 'option-4',
    label: 'Read-only Disabled Select',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByDisplayValue('Option 4')
    
    // Should render as disabled input
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('Option 4')
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    defaultValue: 'option-1',
    label: 'Form-wide Read-only',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // When form is read-only, the field should also be read-only
    const valueDisplay = canvas.getByText('Option 1')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive combobox
    const input = canvas.queryByRole('combobox')
    await expect(input).not.toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: 'option-2',
    label: 'Form-wide Read-only (Disabled Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByDisplayValue('Option 2')
    
    // Should render as disabled input due to form read-only
    await expect(input).toBeDisabled()
  },
}

export const EnumSelect: Story = {
  args: {
    fieldType: 'enum',
    label: 'Enum Select Field',
    helpText: 'This uses an enum to generate options automatically',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Enum Select Field' })
    await expect(input).toBeInTheDocument()
    
    // Test opening dropdown to see enum options
    await userEvent.click(input)
    
    // Check for enum-generated options
    const optionA = canvas.getByText('Option A')
    const optionB = canvas.getByText('Option B')
    await expect(optionA).toBeInTheDocument()
    await expect(optionB).toBeInTheDocument()
    
    // Select an enum option
    await userEvent.click(optionA)
    await expect(input).toHaveValue('Option A')
  },
}

export const CustomOptions: Story = {
  args: {
    customOptions: '["Apple", "Banana", "Cherry", "Date", "Elderberry"]',
    label: 'Custom Fruit Options',
    helpText: 'Select your favorite fruit',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Custom Fruit Options' })
    await expect(input).toBeInTheDocument()
    
    // Test opening dropdown
    await userEvent.click(input)
    
    // Check for custom options
    const apple = canvas.getByText('Apple')
    const banana = canvas.getByText('Banana')
    await expect(apple).toBeInTheDocument()
    await expect(banana).toBeInTheDocument()
    
    // Select a custom option
    await userEvent.click(banana)
    await expect(input).toHaveValue('Banana')
  },
}

export const LongOptions: Story = {
  args: {
    customOptions: '["Very Long Option Name That Might Get Truncated", "Another Extremely Long Option Name", "Short", "Medium Length Option"]',
    label: 'Long Option Names',
    helpText: 'Testing how long option names are handled',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = canvas.getByRole('combobox', { name: 'Long Option Names' })
    await expect(input).toBeInTheDocument()
    
    // Test opening dropdown
    await userEvent.click(input)
    
    // Check for long options
    const longOption = canvas.getByText('Very Long Option Name That Might Get Truncated')
    await expect(longOption).toBeInTheDocument()
    
    // Select a long option
    await userEvent.click(longOption)
    await expect(input).toHaveValue('Very Long Option Name That Might Get Truncated')
  },
} 