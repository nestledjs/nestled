import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface TimePickerFieldStoryArgs {
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
 * The TimePickerField component provides a time input using the HTML time input element.
 * It allows users to select hours and minutes with a native time picker interface.
 */
const meta: Meta<TimePickerFieldStoryArgs> = {
  title: 'Forms/TimePickerField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default time value (HH:MM format)' },
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
    label: 'Meeting Time',
    required: false,
    disabled: false,
    defaultValue: undefined,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select a valid time.',
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookTimePickerField' as const,
      type: FormFieldType.TimePicker as const,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
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
    
    const timeInput = canvas.getByLabelText('Meeting Time')
    await expect(timeInput).toBeInTheDocument()
    await expect(timeInput).toBeEnabled()
    await expect(timeInput).toHaveAttribute('type', 'time')
    await expect(timeInput).toHaveValue('')
    
    // Test setting a time value
    await userEvent.type(timeInput, '14:30')
    await expect(timeInput).toHaveValue('14:30')
    
    // Test clearing
    await userEvent.clear(timeInput)
    await expect(timeInput).toHaveValue('')
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: '09:00',
    label: 'Start Time',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Start Time')
    await expect(timeInput).toHaveValue('09:00')
    
    // Test changing the time
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '10:15')
    await expect(timeInput).toHaveValue('10:15')
  },
}

export const Required: Story = {
  args: {
    required: true,
    label: 'Appointment Time',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Appointment Time *')
    await expect(timeInput).toBeRequired()
    
    // Test setting a required time
    await userEvent.type(timeInput, '15:45')
    await expect(timeInput).toHaveValue('15:45')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '12:00',
    label: 'Disabled Time',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Disabled Time')
    await expect(timeInput).toBeDisabled()
    await expect(timeInput).toHaveValue('12:00')
    
    // Verify cannot be changed when disabled
    await userEvent.type(timeInput, '13:00')
    await expect(timeInput).toHaveValue('12:00') // Should remain unchanged
  },
}

export const Error: Story = {
  args: {
    required: true,
    hasError: true,
    label: 'Time with Error',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Time with Error *')
    await expect(timeInput).toBeRequired()
    
    // Test that input still functions in error state
    await userEvent.type(timeInput, '16:20')
    await expect(timeInput).toHaveValue('16:20')
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Select the time in 24-hour format',
    label: 'Event Time',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Event Time')
    const helpText = canvas.getByText('Select the time in 24-hour format')
    
    await expect(timeInput).toBeInTheDocument()
    await expect(helpText).toBeInTheDocument()
    
    // Test functionality
    await userEvent.type(timeInput, '23:59')
    await expect(timeInput).toHaveValue('23:59')
  },
}

export const MorningTime: Story = {
  args: {
    defaultValue: '08:30',
    label: 'Morning Meeting',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Morning Meeting')
    await expect(timeInput).toHaveValue('08:30')
    
    // Test changing to another morning time
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '07:15')
    await expect(timeInput).toHaveValue('07:15')
  },
}

export const AfternoonTime: Story = {
  args: {
    defaultValue: '14:00',
    label: 'Afternoon Session',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Afternoon Session')
    await expect(timeInput).toHaveValue('14:00')
    
    // Test changing to another afternoon time
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '16:45')
    await expect(timeInput).toHaveValue('16:45')
  },
}

export const EveningTime: Story = {
  args: {
    defaultValue: '19:30',
    label: 'Evening Event',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Evening Event')
    await expect(timeInput).toHaveValue('19:30')
    
    // Test changing to another evening time
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '20:00')
    await expect(timeInput).toHaveValue('20:00')
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: '11:45',
    label: 'Read-only Time',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as text, not an input
    const valueDisplay = canvas.getByText('11:45')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive input
    const timeInput = canvas.queryByRole('textbox')
    await expect(timeInput).not.toBeInTheDocument()
  },
}

export const ReadOnlyEmpty: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    label: 'Empty Read-only Time',
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
    defaultValue: '13:15',
    label: 'Read-only Disabled Style',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Read-only Disabled Style')
    
    // Should render as disabled input
    await expect(timeInput).toBeDisabled()
    await expect(timeInput).toHaveValue('13:15')
    
    // Verify cannot be modified
    await userEvent.type(timeInput, '14:00')
    await expect(timeInput).toHaveValue('13:15') // Should remain unchanged
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    defaultValue: '17:30',
    label: 'Form-wide Read-only',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // When form is read-only, the field should also be read-only
    const valueDisplay = canvas.getByText('17:30')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive input
    const timeInput = canvas.queryByRole('textbox')
    await expect(timeInput).not.toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: '22:00',
    label: 'Form-wide Read-only (Disabled Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Form-wide Read-only (Disabled Style)')
    
    // Should render as disabled input due to form read-only
    await expect(timeInput).toBeDisabled()
    await expect(timeInput).toHaveValue('22:00')
  },
}

export const MidnightTime: Story = {
  args: {
    defaultValue: '00:00',
    label: 'Midnight Time',
    helpText: 'Midnight is represented as 00:00',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Midnight Time')
    await expect(timeInput).toHaveValue('00:00')
    
    // Test changing from midnight
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '00:30')
    await expect(timeInput).toHaveValue('00:30')
  },
}

export const NoonTime: Story = {
  args: {
    defaultValue: '12:00',
    label: 'Noon Time',
    helpText: 'Noon is represented as 12:00',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Noon Time')
    await expect(timeInput).toHaveValue('12:00')
    
    // Test changing from noon
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '12:30')
    await expect(timeInput).toHaveValue('12:30')
  },
}

export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard Navigation Test',
    helpText: 'Use Tab to navigate, arrow keys to adjust time',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const timeInput = canvas.getByLabelText('Keyboard Navigation Test')
    
    // Focus the input
    timeInput.focus()
    await expect(timeInput).toHaveFocus()
    
    // Test typing a time
    await userEvent.type(timeInput, '18:45')
    await expect(timeInput).toHaveValue('18:45')
    
    // Test selecting all and replacing
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '21:15')
    await expect(timeInput).toHaveValue('21:15')
  },
} 