import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface PhoneFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue?: string
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  placeholder: string
  helpText?: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The PhoneField component provides a telephone number input with US phone number validation.
 * It uses the react-phone-number-input library for validation and supports various display states.
 */
const meta: Meta<PhoneFieldStoryArgs> = {
  title: 'Forms/PhoneField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default phone number' },
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
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
  args: {
    label: 'Phone Number',
    required: false,
    disabled: false,
    defaultValue: undefined,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please enter a valid phone number.',
    placeholder: 'Enter your phone number...',
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookPhoneField',
      type: FormFieldType.Phone as const,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        placeholder: args.placeholder,
        helpText: args.helpText,
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
    const input = canvas.getByLabelText('Phone Number')
    
    // Verify it's a tel input
    await expect(input).toHaveAttribute('type', 'tel')
    await expect(input).toBeEnabled()
    
    // Test phone input functionality
    await userEvent.type(input, '(555) 123-4567')
    await expect(input).toHaveValue('(555) 123-4567')
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: '(555) 987-6543',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Phone Number')
    
    // Verify default value is set
    await expect(input).toHaveValue('(555) 987-6543')
    
    // Test modifying the value
    await userEvent.clear(input)
    await userEvent.type(input, '(555) 111-2222')
    await expect(input).toHaveValue('(555) 111-2222')
  },
}

export const Required: Story = {
  args: {
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Phone Number *')
    
    // Verify required attribute
    await expect(input).toBeRequired()
    await expect(input).toHaveAttribute('type', 'tel')
    
    // Test input functionality
    await userEvent.type(input, '555-123-4567')
    await expect(input).toHaveValue('555-123-4567')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '(555) 444-5555',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Phone Number')
    
    // Verify disabled state
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('(555) 444-5555')
    
    // Verify input cannot be modified
    await userEvent.click(input)
    await userEvent.type(input, '123')
    await expect(input).toHaveValue('(555) 444-5555') // Value should remain unchanged
  },
}

export const Error: Story = {
  args: {
    required: true,
    hasError: true,
    defaultValue: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Phone Number *')
    
    // Test error styling is applied
    await expect(input).toBeRequired()
    
    // Type an invalid phone number to trigger validation error
    await userEvent.type(input, '123')
    
    // Check for error message
    const errorMessage = canvas.getByText('* Phone number is invalid')
    await expect(errorMessage).toBeInTheDocument()
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: '(555) 777-8888',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should display as plain text, not an input
    const valueDisplay = canvas.getByText('(555) 777-8888')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have a textbox input
    const inputs = canvas.queryAllByRole('textbox')
    await expect(inputs).toHaveLength(0)
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: '(555) 999-0000',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Phone Number')
    
    // Should display as disabled input
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('(555) 999-0000')
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Enter your phone number including area code',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const helpText = canvas.getByText('Enter your phone number including area code')
    await expect(helpText).toBeInTheDocument()
    
    const input = canvas.getByLabelText('Phone Number')
    await userEvent.type(input, '(555) 123-4567')
    await expect(input).toHaveValue('(555) 123-4567')
  },
}

export const FormReadOnlyValue: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    defaultValue: '(555) 111-0000',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should display as plain text due to form-level read-only
    const valueDisplay = canvas.getByText('(555) 111-0000')
    await expect(valueDisplay).toBeInTheDocument()
    
    const inputs = canvas.queryAllByRole('textbox')
    await expect(inputs).toHaveLength(0)
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: '(555) 222-0000',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Phone Number')
    
    // Should display as disabled input due to form-level read-only
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('(555) 222-0000')
  },
}

export const ValidationDemo: Story = {
  args: {
    helpText: 'Try entering valid and invalid phone numbers to see validation',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Phone Number')
    
    // Test valid phone number formats
    await userEvent.clear(input)
    await userEvent.type(input, '(555) 123-4567')
    await expect(input).toHaveValue('(555) 123-4567')
    
    await userEvent.clear(input)
    await userEvent.type(input, '555-123-4567')
    await expect(input).toHaveValue('555-123-4567')
    
    await userEvent.clear(input)
    await userEvent.type(input, '555.123.4567')
    await expect(input).toHaveValue('555.123.4567')
  },
}

export const EmptyState: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show the empty state indicator
    const emptyIndicator = canvas.getByText('—')
    await expect(emptyIndicator).toBeInTheDocument()
  },
} 