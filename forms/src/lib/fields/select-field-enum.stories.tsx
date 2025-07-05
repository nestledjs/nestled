import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface SelectFieldEnumStoryArgs {
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
}

/**
 * The SelectFieldEnum component provides a dropdown selection interface for enum values.
 * It transforms enum key-value pairs into select options and delegates to SelectField.
 */
const meta: Meta<SelectFieldEnumStoryArgs> = {
  title: 'Forms/SelectFieldEnum',
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
  },
  args: {
    label: 'Enum Select Option',
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
  },
  render: (args) => {
    const field = {
      key: 'storybookEnumSelectField' as const,
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
    
    const select = canvas.getByRole('combobox', { name: 'Enum Select Option' })
    await expect(select).toBeInTheDocument()
    await expect(select).toBeEnabled()
    
    // Test selecting an enum option
    await userEvent.selectOptions(select, 'option-a')
    await expect(select).toHaveValue('option-a')
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'option-b',
    label: 'Pre-selected Enum Option',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const select = canvas.getByRole('combobox', { name: 'Pre-selected Enum Option' })
    await expect(select).toHaveValue('option-b')
  },
}

export const Required: Story = {
  args: {
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const select = canvas.getByRole('combobox', { name: 'Enum Select Option*' })
    await expect(select).toBeRequired()
    
    // Test selection
    await userEvent.selectOptions(select, 'option-c')
    await expect(select).toHaveValue('option-c')
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 'option-b',
    label: 'Read-only Enum Select',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as a div, not an input
    const valueDisplay = canvas.getByText('Option B')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive combobox
    const input = canvas.queryByRole('combobox')
    await expect(input).not.toBeInTheDocument()
  },
}

export const DifferentEnumValues: Story = {
  args: {
    label: 'Status Enum',
    required: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookStatusField' as const,
      type: FormFieldType.EnumSelect as const,
      options: {
        label: args.label,
        required: args.required,
        enum: {
          'Active': 'ACTIVE',
          'Inactive': 'INACTIVE', 
          'Pending': 'PENDING',
          'Archived': 'ARCHIVED',
        },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const select = canvas.getByRole('combobox', { name: 'Status Enum*' })
    await expect(select).toBeRequired()
    
    // Test selecting different enum values
    await userEvent.selectOptions(select, 'ACTIVE')
    await expect(select).toHaveValue('ACTIVE')
    
    await userEvent.selectOptions(select, 'PENDING')
    await expect(select).toHaveValue('PENDING')
  },
} 