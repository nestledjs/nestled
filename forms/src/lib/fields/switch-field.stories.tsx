import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface SwitchFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: boolean
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
 * The SwitchField component provides a toggle switch interface using Headless UI Switch.
 * It's perfect for boolean settings, preferences, and on/off toggles with smooth animations.
 */
const meta: Meta<SwitchFieldStoryArgs> = {
  title: 'Forms/SwitchField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'boolean', description: 'Default switch state' },
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
    label: 'Enable Notifications',
    required: false,
    disabled: false,
    defaultValue: false,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'This setting is required.',
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookSwitchField' as const,
      type: FormFieldType.Switch as const,
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
  name: 'Default State (Off)',
  args: { showState: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Enable Notifications' })
    await expect(switchElement).toBeInTheDocument()
    await expect(switchElement).toBeEnabled()
    await expect(switchElement).not.toBeChecked()
    
    // Test toggling the switch
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked()
    
    // Toggle back off
    await userEvent.click(switchElement)
    await expect(switchElement).not.toBeChecked()
  },
}

export const DefaultOn: Story = {
  name: 'Default State (On)',
  args: {
    defaultValue: true,
    label: 'Auto-save Enabled',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Auto-save Enabled' })
    await expect(switchElement).toBeChecked()
    
    // Test toggling off
    await userEvent.click(switchElement)
    await expect(switchElement).not.toBeChecked()
    
    // Toggle back on
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked()
  },
}

export const Required: Story = {
  args: {
    required: true,
    label: 'Accept Terms',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Accept Terms *' })
    await expect(switchElement).toHaveAttribute('aria-required', 'true')
    await expect(switchElement).not.toBeChecked()
    
    // Test toggling
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked()
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: true,
    label: 'Disabled Setting',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Disabled Setting' })
    await expect(switchElement).toBeDisabled()
    await expect(switchElement).toBeChecked()
    
    // Verify cannot be toggled when disabled
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked() // Should remain checked
  },
}

export const DisabledOff: Story = {
  args: {
    disabled: true,
    defaultValue: false,
    label: 'Disabled Off Setting',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Disabled Off Setting' })
    await expect(switchElement).toBeDisabled()
    await expect(switchElement).not.toBeChecked()
    
    // Verify cannot be toggled when disabled
    await userEvent.click(switchElement)
    await expect(switchElement).not.toBeChecked() // Should remain unchecked
  },
}

export const Error: Story = {
  args: {
    required: true,
    hasError: true,
    label: 'Terms Agreement',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Terms Agreement *' })
    await expect(switchElement).toHaveAttribute('aria-required', 'true')
    
    // Test that switch still functions in error state
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked()
    
    // Toggle back
    await userEvent.click(switchElement)
    await expect(switchElement).not.toBeChecked()
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Receive email notifications about important updates',
    label: 'Email Notifications',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Email Notifications' })
    const helpText = canvas.getByText('Receive email notifications about important updates')
    
    await expect(switchElement).toBeInTheDocument()
    await expect(helpText).toBeInTheDocument()
    
    // Test functionality
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked()
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: true,
    label: 'Read-only Setting',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as text, not a switch
    const valueDisplay = canvas.getByText('On')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive switch
    const switchElement = canvas.queryByRole('switch')
    await expect(switchElement).not.toBeInTheDocument()
  },
}

export const ReadOnlyValueOff: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: false,
    label: 'Read-only Off Setting',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should show "Off"
    const valueDisplay = canvas.getByText('Off')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive switch
    const switchElement = canvas.queryByRole('switch')
    await expect(switchElement).not.toBeInTheDocument()
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: true,
    label: 'Read-only Disabled Switch',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Read-only Disabled Switch' })
    
    // Should render as disabled switch
    await expect(switchElement).toBeDisabled()
    await expect(switchElement).toBeChecked()
    
    // Verify cannot be modified
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked() // Should remain checked
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    defaultValue: true,
    label: 'Form-wide Read-only',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // When form is read-only, the field should also be read-only
    const valueDisplay = canvas.getByText('On')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive switch
    const switchElement = canvas.queryByRole('switch')
    await expect(switchElement).not.toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: false,
    label: 'Form-wide Read-only (Disabled Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Form-wide Read-only (Disabled Style)' })
    
    // Should render as disabled switch due to form read-only
    await expect(switchElement).toBeDisabled()
    await expect(switchElement).not.toBeChecked()
  },
}

export const ToggleDemo: Story = {
  args: {
    label: 'Dark Mode',
    helpText: 'Toggle between light and dark themes',
    defaultValue: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Dark Mode' })
    await expect(switchElement).not.toBeChecked()
    
    // Demonstrate multiple toggles
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked()
    
    // Wait a moment to see the animation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    await userEvent.click(switchElement)
    await expect(switchElement).not.toBeChecked()
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    await userEvent.click(switchElement)
    await expect(switchElement).toBeChecked()
  },
}

export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard Accessible Switch',
    helpText: 'Use Space or Enter to toggle',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const switchElement = canvas.getByRole('switch', { name: 'Keyboard Accessible Switch' })
    
    // Focus the switch
    switchElement.focus()
    await expect(switchElement).toHaveFocus()
    await expect(switchElement).not.toBeChecked()
    
    // Toggle with Space key
    await userEvent.keyboard(' ')
    await expect(switchElement).toBeChecked()
    
    // Toggle with Space key again
    await userEvent.keyboard(' ')
    await expect(switchElement).not.toBeChecked()
  },
} 