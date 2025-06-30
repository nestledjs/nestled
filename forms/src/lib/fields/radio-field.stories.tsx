import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface RadioFieldStoryArgs {
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
  radioDirection: 'row' | 'column'
  fullWidthLabel: boolean
  fancyStyle: boolean
}

/**
 * The RadioField component provides radio button selection with multiple options.
 * It supports various layouts, styling options, and sub-options for complex forms.
 */
const meta: Meta<RadioFieldStoryArgs> = {
  title: 'Forms/RadioField',
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
    radioDirection: {
      control: 'radio',
      options: ['row', 'column'],
      description: 'Layout direction',
    },
    fullWidthLabel: { control: 'boolean', description: 'Full width labels?' },
    fancyStyle: { control: 'boolean', description: 'Fancy border style?' },
  },
  args: {
    label: 'Choose an option',
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
    radioDirection: 'column',
    fullWidthLabel: false,
    fancyStyle: false,
  },
  render: (args) => {
    const field = {
      key: 'storybookRadioField',
      type: FormFieldType.Radio as const,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        helpText: args.helpText,
        radioDirection: args.radioDirection,
        fullWidthLabel: args.fullWidthLabel,
        fancyStyle: args.fancyStyle,
        radioOptions: [
          { key: 'option1', label: 'Option 1', value: 'opt1' },
          { key: 'option2', label: 'Option 2', value: 'opt2' },
          { key: 'option3', label: 'Option 3', value: 'opt3' },
          { key: 'option4', label: 'Other', value: 'other', checkedSubOption: { key: 'otherText', label: 'Please specify' } },
        ],
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
  name: 'Default State (Column)',
  args: { showState: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify radio inputs are present
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    const option2 = canvas.getByRole('radio', { name: 'Option 2' })
    const option3 = canvas.getByRole('radio', { name: 'Option 3' })
    
    await expect(option1).toHaveAttribute('type', 'radio')
    await expect(option1).toBeEnabled()
    await expect(option2).toBeEnabled()
    await expect(option3).toBeEnabled()
    
    // Test radio selection
    await userEvent.click(option2)
    await expect(option2).toBeChecked()
    await expect(option1).not.toBeChecked()
    await expect(option3).not.toBeChecked()
  },
}

export const RowLayout: Story = {
  args: {
    radioDirection: 'row',
    label: 'Choose an option (Row Layout)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    const option2 = canvas.getByRole('radio', { name: 'Option 2' })
    
    // Test selection in row layout
    await userEvent.click(option1)
    await expect(option1).toBeChecked()
    
    await userEvent.click(option2)
    await expect(option2).toBeChecked()
    await expect(option1).not.toBeChecked()
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'opt2',
    label: 'Pre-selected Option',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify default selection
    const option2 = canvas.getByRole('radio', { name: 'Option 2' })
    await expect(option2).toBeChecked()
  },
}

export const Required: Story = {
  args: {
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    await expect(option1).toBeRequired()
    
    // Test selection
    await userEvent.click(option1)
    await expect(option1).toBeChecked()
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'opt1',
    label: 'Disabled Radio Group',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    const option2 = canvas.getByRole('radio', { name: 'Option 2' })
    
    // Verify disabled state
    await expect(option1).toBeDisabled()
    await expect(option2).toBeDisabled()
    await expect(option1).toBeChecked() // Should maintain default value
    
    // Verify clicking doesn't change selection
    await userEvent.click(option2)
    await expect(option1).toBeChecked() // Should remain selected
    await expect(option2).not.toBeChecked()
  },
}

export const WithSubOption: Story = {
  args: {
    defaultValue: 'other',
    label: 'Radio with Sub-option',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Select the "Other" option which has a sub-option
    const otherOption = canvas.getByRole('radio', { name: 'Other' })
    await userEvent.click(otherOption)
    await expect(otherOption).toBeChecked()
    
    // Verify sub-option input appears
    const subInput = await canvas.findByPlaceholderText('Please specify')
    await expect(subInput).toBeInTheDocument()
    // Test typing in sub-option
    await userEvent.type(subInput, 'Custom option')
    await expect(subInput).toHaveValue('Custom option')
  },
}

export const FullWidthLabels: Story = {
  args: {
    fullWidthLabel: true,
    label: 'Full Width Labels',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    await userEvent.click(option1)
    await expect(option1).toBeChecked()
  },
}

export const FancyStyle: Story = {
  args: {
    fancyStyle: true,
    label: 'Fancy Bordered Style',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    await userEvent.click(option1)
    await expect(option1).toBeChecked()
  },
}

export const Error: Story = {
  args: {
    required: true,
    hasError: true,
    label: 'Radio Group (Error State)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    await expect(option1).toBeRequired()
    
    // Test that selection still works in error state
    await userEvent.click(option1)
    await expect(option1).toBeChecked()
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 'opt2',
    label: 'Read-only (Value Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should display selected value with checkmark icon
    const selectedDisplay = canvas.getByText('Option 2')
    await expect(selectedDisplay).toBeInTheDocument()
    
    // Should not have radio inputs
    const radioInputs = canvas.queryAllByRole('radio')
    await expect(radioInputs).toHaveLength(0)
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: 'opt3',
    label: 'Read-only (Disabled Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should display disabled radio inputs
    const radioInputs = canvas.getAllByRole('radio')
    await expect(radioInputs.length).toBeGreaterThan(0)
    
    // All should be disabled
    for (const radio of radioInputs) {
      await expect(radio).toBeDisabled()
    }
    
    // Option 3 should be checked
    const option3 = canvas.getByRole('radio', { name: 'Option 3' })
    await expect(option3).toBeChecked()
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Select the option that best describes your situation',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const helpText = canvas.getByText('Select the option that best describes your situation')
    await expect(helpText).toBeInTheDocument()
    
    const option1 = canvas.getByRole('radio', { name: 'Option 1' })
    await userEvent.click(option1)
    await expect(option1).toBeChecked()
  },
}

export const FormReadOnlyValue: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    defaultValue: 'opt1',
    label: 'Form Read-only (Value)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should display selected value due to form-level read-only
    const selectedDisplay = canvas.getByText('Option 1')
    await expect(selectedDisplay).toBeInTheDocument()
    
    const radioInputs = canvas.queryAllByRole('radio')
    await expect(radioInputs).toHaveLength(0)
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: 'opt2',
    label: 'Form Read-only (Disabled)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should display disabled radio inputs due to form-level read-only
    const radioInputs = canvas.getAllByRole('radio')
    await expect(radioInputs.length).toBeGreaterThan(0)
    
    for (const radio of radioInputs) {
      await expect(radio).toBeDisabled()
    }
    
    const option2 = canvas.getByRole('radio', { name: 'Option 2' })
    await expect(option2).toBeChecked()
  },
}

export const EmptyState: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: undefined,
    label: 'No Selection Made',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show the unselected state icon (X mark)
    // The component should render the readOnlyUnselectedIcon
    const container = canvas.getByText('No Selection Made').closest('div')
    await expect(container).toBeInTheDocument()
  },
} 