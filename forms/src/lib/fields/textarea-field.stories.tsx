import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface TextAreaFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  placeholder?: string
  defaultValue?: string
  rows: number
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  helpText?: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The TextAreaField component provides a multi-line text input using a standard HTML textarea element.
 * It's perfect for longer text content like descriptions, comments, and messages with configurable height.
 */
const meta: Meta<TextAreaFieldStoryArgs> = {
  title: 'Forms/TextAreaField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    defaultValue: { control: 'text', description: 'Default text content' },
    rows: { control: 'number', description: 'Number of visible rows' },
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
  },
  args: {
    label: 'Description',
    required: false,
    disabled: false,
    placeholder: undefined,
    defaultValue: undefined,
    rows: 4,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'This field is required.',
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookTextAreaField' as const,
      type: FormFieldType.TextArea as const,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        placeholder: args.placeholder,
        defaultValue: args.defaultValue,
        rows: args.rows,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
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
    
    const textareaElement = canvas.getByLabelText('Description')
    await expect(textareaElement).toBeInTheDocument()
    await expect(textareaElement).toBeEnabled()
    await expect(textareaElement).toHaveValue('')
    
    // Test typing
    await userEvent.type(textareaElement, 'This is a test description')
    await expect(textareaElement).toHaveValue('This is a test description')
    
    // Test clearing
    await userEvent.clear(textareaElement)
    await expect(textareaElement).toHaveValue('')
  },
}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Enter your description here...',
    label: 'Product Description',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByPlaceholderText('Enter your description here...')
    await expect(textareaElement).toBeInTheDocument()
    await expect(textareaElement).toHaveAttribute('placeholder', 'Enter your description here...')
    
    // Test typing over placeholder
    await userEvent.type(textareaElement, 'A detailed product description')
    await expect(textareaElement).toHaveValue('A detailed product description')
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'This is the default content for the textarea field.',
    label: 'Comment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Comment')
    await expect(textareaElement).toHaveValue('This is the default content for the textarea field.')
    
    // Test appending to default value
    await userEvent.type(textareaElement, '\n\nAdditional content added.')
    await expect(textareaElement).toHaveValue('This is the default content for the textarea field.\n\nAdditional content added.')
  },
}

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'This field is required',
    label: 'Required Description',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Required Description *')
    await expect(textareaElement).toBeRequired()
    
    // Test typing
    await userEvent.type(textareaElement, 'Meeting notes from today')
    await expect(textareaElement).toHaveValue('Meeting notes from today')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'This textarea is disabled and cannot be edited.',
    label: 'Disabled Field',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Disabled Field')
    await expect(textareaElement).toBeDisabled()
    await expect(textareaElement).toHaveValue('This textarea is disabled and cannot be edited.')
    
    // Verify cannot be edited when disabled
    await userEvent.type(textareaElement, 'Should not work')
    await expect(textareaElement).toHaveValue('This textarea is disabled and cannot be edited.')
  },
}

export const Error: Story = {
  args: {
    required: true,
    hasError: true,
    placeholder: 'Please provide a description',
    label: 'Description with Error',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Description with Error *')
    await expect(textareaElement).toBeRequired()
    
    // Test that textarea still functions in error state
    await userEvent.type(textareaElement, 'Fixing the error by adding content')
    await expect(textareaElement).toHaveValue('Fixing the error by adding content')
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Provide a detailed description of the item or situation',
    label: 'Detailed Description',
    placeholder: 'Start typing your description...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Detailed Description')
    const helpText = canvas.getByText('Provide a detailed description of the item or situation')
    
    await expect(textareaElement).toBeInTheDocument()
    await expect(helpText).toBeInTheDocument()
    
    // Test functionality
    await userEvent.type(textareaElement, 'This is a comprehensive description with multiple lines.\n\nIt includes various details and explanations.')
    await expect(textareaElement).toHaveValue('This is a comprehensive description with multiple lines.\n\nIt includes various details and explanations.')
  },
}

export const CustomRows: Story = {
  args: {
    rows: 8,
    label: 'Large Text Area',
    placeholder: 'This textarea has 8 rows for more content...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Large Text Area')
    await expect(textareaElement).toHaveAttribute('rows', '8')
    
    // Test with multi-line content
    const longText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8'
    await userEvent.type(textareaElement, longText)
    await expect(textareaElement).toHaveValue(longText)
  },
}

export const SmallRows: Story = {
  args: {
    rows: 2,
    label: 'Compact Text Area',
    placeholder: 'Compact 2-row textarea',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Compact Text Area')
    await expect(textareaElement).toHaveAttribute('rows', '2')
    
    // Test with content that might overflow
    await userEvent.type(textareaElement, 'Short content for compact area')
    await expect(textareaElement).toHaveValue('Short content for compact area')
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 'This is read-only content displayed as plain text.\n\nIt preserves line breaks and formatting.',
    label: 'Read-only Content',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as text, not a textarea
    const valueDisplays = canvas.getAllByText(/This is read-only content displayed as plain text/)
    expect(valueDisplays.length).toBeGreaterThan(0)
    
    // Should not have an interactive textarea
    const textareaElement = canvas.queryByRole('textbox')
    await expect(textareaElement).not.toBeInTheDocument()
  },
}

export const ReadOnlyEmpty: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    label: 'Empty Read-only Field',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show em dash for empty content
    const valueDisplay = canvas.getByText('—')
    await expect(valueDisplay).toBeInTheDocument()
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: 'This content is read-only but displayed as a disabled textarea.',
    label: 'Read-only Disabled Style',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Read-only Disabled Style')
    
    // Should render as disabled textarea
    await expect(textareaElement).toBeDisabled()
    await expect(textareaElement).toHaveValue('This content is read-only but displayed as a disabled textarea.')
    
    // Verify cannot be modified
    await userEvent.type(textareaElement, 'Should not work')
    await expect(textareaElement).toHaveValue('This content is read-only but displayed as a disabled textarea.')
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    defaultValue: 'Form-wide read-only content\nwith multiple lines.',
    label: 'Form-wide Read-only',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // When form is read-only, the field should also be read-only
    const valueDisplays = canvas.getAllByText(/Form-wide read-only content/)
    expect(valueDisplays.length).toBeGreaterThan(0)
    
    // Should not have an interactive textarea
    const textareaElement = canvas.queryByRole('textbox')
    await expect(textareaElement).not.toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: 'Form-wide read-only with disabled style.',
    label: 'Form-wide Read-only (Disabled Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Form-wide Read-only (Disabled Style)')
    
    // Should render as disabled textarea due to form read-only
    await expect(textareaElement).toBeDisabled()
    await expect(textareaElement).toHaveValue('Form-wide read-only with disabled style.')
  },
}

export const LongContent: Story = {
  args: {
    defaultValue: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    label: 'Long Content Example',
    rows: 6,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Long Content Example') as HTMLTextAreaElement
    const initialValue = textareaElement.value
    await expect(initialValue).toContain('Lorem ipsum dolor sit amet')
    
    // Test editing long content
    await userEvent.click(textareaElement)
    await userEvent.keyboard('{End}')
    await userEvent.type(textareaElement, '\n\nAdditional paragraph added to the long content.')
    
    const finalValue = textareaElement.value
    await expect(finalValue).toContain('Additional paragraph added to the long content')
  },
}

export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard Navigation Test',
    placeholder: 'Use Tab to navigate, Enter for new lines',
    rows: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const textareaElement = canvas.getByLabelText('Keyboard Navigation Test')
    
    // Focus the textarea
    textareaElement.focus()
    await expect(textareaElement).toHaveFocus()
    
    // Test typing with Enter for new lines
    await userEvent.type(textareaElement, 'First line{Enter}Second line{Enter}Third line')
    await expect(textareaElement).toHaveValue('First line\nSecond line\nThird line')
    
    // Test navigation within the textarea
    await userEvent.clear(textareaElement)
    await userEvent.type(textareaElement, 'Start: First line\nSecond line\nThird line')
    await expect(textareaElement).toHaveValue('Start: First line\nSecond line\nThird line')
  },
} 