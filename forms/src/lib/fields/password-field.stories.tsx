import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface PasswordFieldStoryArgs {
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
 * The PasswordField component provides a secure password input with masked characters.
 * In read-only mode, it displays asterisks representing the password length for security.
 */
const meta: Meta<PasswordFieldStoryArgs> = {
  title: 'Forms/PasswordField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default value' },
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
    label: 'Password',
    required: false,
    disabled: false,
    defaultValue: undefined,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please enter a valid password.',
    placeholder: 'Enter your password...',
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookPasswordField',
      type: FormFieldType.Password as const,
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
    const input = canvas.getByLabelText('Password')
    
    // Verify it's a password input
    await expect(input).toHaveAttribute('type', 'password')
    await expect(input).toBeEnabled()
    
    // Test password input functionality
    await userEvent.type(input, 'secretpassword')
    await expect(input).toHaveValue('secretpassword')
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'defaultpass123',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Password')
    
    // Verify default value is set (though it will be masked)
    await expect(input).toHaveValue('defaultpass123')
    
    // Test modifying the value
    await userEvent.clear(input)
    await userEvent.type(input, 'newpassword')
    await expect(input).toHaveValue('newpassword')
  },
}

export const Required: Story = {
  args: {
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Password *')
    
    // Verify required attribute
    await expect(input).toBeRequired()
    await expect(input).toHaveAttribute('type', 'password')
    
    // Test input functionality
    await userEvent.type(input, 'mypassword')
    await expect(input).toHaveValue('mypassword')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'disabledpass',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Password')
    
    // Verify disabled state
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('disabledpass')
    
    // Verify input cannot be modified
    await userEvent.click(input)
    await userEvent.type(input, 'newtext')
    await expect(input).toHaveValue('disabledpass') // Value should remain unchanged
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
    const input = canvas.getByLabelText('Password *')
    
    // Test error styling is applied (component should have error classes)
    await expect(input).toBeRequired()
    
    // Test that user can still type in error state
    await userEvent.type(input, 'validpassword')
    await expect(input).toHaveValue('validpassword')
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 'secretpassword123',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as a div with asterisks
    const valueDisplay = canvas.getByText('*****************') // 17 asterisks for 'secretpassword123'
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have a password input element
    const inputs = canvas.queryAllByDisplayValue('secretpassword123')
    await expect(inputs).toHaveLength(0)
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: 'mypassword',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Password')
    
    // Should render as disabled password input
    await expect(input).toBeDisabled()
    await expect(input).toHaveAttribute('type', 'password')
    await expect(input).toHaveValue('mypassword')
    
    // Verify cannot be modified
    await userEvent.click(input)
    await userEvent.type(input, 'newtext')
    await expect(input).toHaveValue('mypassword')
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    defaultValue: 'formreadonly',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should render as read-only value (default formReadOnlyStyle is 'value')
    const valueDisplay = canvas.getByText('************') // 12 asterisks for 'formreadonly'
    await expect(valueDisplay).toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: 'formpass',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Password')
    
    // Should render as disabled input when formReadOnlyStyle is 'disabled'
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('formpass')
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Password must be at least 8 characters long',
    defaultValue: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Password')
    const helpText = canvas.getByText('Password must be at least 8 characters long')
    
    // Verify help text is displayed
    await expect(helpText).toBeInTheDocument()
    
    // Test input functionality with help text present
    await userEvent.type(input, 'strongpassword123')
    await expect(input).toHaveValue('strongpassword123')
  },
}

export const EmptyReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show placeholder dash for empty value
    const valueDisplay = canvas.getByText('—')
    await expect(valueDisplay).toBeInTheDocument()
  },
}

export const PasswordSecurity: Story = {
  name: 'Password Security Demo',
  args: {
    label: 'Secure Password',
    placeholder: 'Enter a strong password...',
    helpText: 'Your password is automatically masked for security',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Secure Password')
    
    // Demonstrate that password is masked while typing
    await userEvent.type(input, 'supersecretpassword')
    await expect(input).toHaveValue('supersecretpassword')
    
    // Verify the input type is password (characters are masked in UI)
    await expect(input).toHaveAttribute('type', 'password')
  },
} 