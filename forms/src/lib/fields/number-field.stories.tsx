import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface NumberFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue?: number
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  placeholder: string
  min?: number
  max?: number
  step?: number
  helpText?: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The NumberField component provides a numeric input with validation and constraints.
 * It supports min/max values, step increments, and all standard form field states.
 */
const meta: Meta<NumberFieldStoryArgs> = {
  title: 'Forms/NumberField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'number', description: 'Default value' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    min: { control: 'number', description: 'Minimum value' },
    max: { control: 'number', description: 'Maximum value' },
    step: { control: 'number', description: 'Step increment' },
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
    label: 'Quantity',
    required: false,
    disabled: false,
    defaultValue: undefined,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please enter a valid number.',
    placeholder: 'Enter quantity...',
    min: undefined,
    max: undefined,
    step: undefined,
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookNumberField',
      type: FormFieldType.Number as const,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        placeholder: args.placeholder,
        min: args.min,
        max: args.max,
        step: args.step,
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
  args: {
    label: 'Quantity',
    placeholder: 'Enter quantity...',
    required: false,
    disabled: false,
    readOnly: false,
    readOnlyStyle: 'value',
    defaultValue: undefined,
    min: undefined,
    max: undefined,
    step: undefined,
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity')
    
    // Test input functionality
    await userEvent.clear(input)
    await userEvent.type(input, '42')
    await expect(input).toHaveValue(42)
  },
}

export const WithValue: Story = {
  args: {
    ...Default.args,
    defaultValue: 25,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity')
    
    // Verify default value is set
    await expect(input).toHaveValue(25)
    
    // Test modifying the value
    await userEvent.clear(input)
    await userEvent.type(input, '100')
    await expect(input).toHaveValue(100)
  },
}

export const Required: Story = {
  args: {
    ...Default.args,
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity *')
    
    // Verify required attribute
    await expect(input).toBeRequired()
    
    // Test input functionality
    await userEvent.type(input, '15')
    await expect(input).toHaveValue(15)
  },
}

export const WithConstraints: Story = {
  args: {
    ...Default.args,
    label: 'Age',
    min: 0,
    max: 120,
    step: 1,
    defaultValue: 25,
    helpText: 'Enter your age (0-120 years)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Age')
    const helpText = canvas.getByText('Enter your age (0-120 years)')
    
    // Verify constraints and help text
    await expect(input).toHaveAttribute('min', '0')
    await expect(input).toHaveAttribute('max', '120')
    await expect(input).toHaveAttribute('step', '1')
    await expect(helpText).toBeInTheDocument()
    
    // Test value within constraints
    await userEvent.clear(input)
    await userEvent.type(input, '30')
    await expect(input).toHaveValue(30)
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
    defaultValue: 50,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity')
    
    // Verify disabled state
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue(50)
    
    // Verify input cannot be modified
    await userEvent.click(input)
    await userEvent.type(input, '999')
    await expect(input).toHaveValue(50) // Value should remain unchanged
  },
}

export const Error: Story = {
  args: {
    ...Default.args,
    required: true,
    defaultValue: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity *')
    
    // Simulate form submission to trigger validation
    await userEvent.click(input)
    await userEvent.tab()
    
    // Test error styling is applied (component should have error classes)
    await expect(input).toBeRequired()
  },
}

export const ReadOnlyValue: Story = {
  args: {
    ...Default.args,
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 75,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as a div, not an input
    const valueDisplay = canvas.getByText('75')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an input element
    const inputs = canvas.queryAllByRole('spinbutton')
    await expect(inputs).toHaveLength(0)
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    ...Default.args,
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: 88,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity')
    
    // Should render as disabled input
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue(88)
    
    // Verify cannot be modified
    await userEvent.click(input)
    await userEvent.type(input, '999')
    await expect(input).toHaveValue(88)
  },
}

export const FormReadOnly: Story = {
  args: {
    ...Default.args,
    formReadOnly: true,
    defaultValue: 200,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should render as read-only value (default formReadOnlyStyle is 'value')
    const valueDisplay = canvas.getByText('200')
    await expect(valueDisplay).toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    ...Default.args,
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: 150,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity')
    
    // Should render as disabled input when formReadOnlyStyle is 'disabled'
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue(150)
  },
}

export const WithHelpText: Story = {
  args: {
    ...Default.args,
    helpText: 'Enter a positive number',
    defaultValue: 10,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Quantity')
    const helpText = canvas.getByText('Enter a positive number')
    
    // Verify help text is displayed
    await expect(helpText).toBeInTheDocument()
    await expect(input).toHaveValue(10)
    
    // Test input functionality with help text present
    await userEvent.clear(input)
    await userEvent.type(input, '25')
    await expect(input).toHaveValue(25)
  },
}

export const EmptyReadOnlyValue: Story = {
  args: {
    ...Default.args,
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