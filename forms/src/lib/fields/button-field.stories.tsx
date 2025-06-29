import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface ButtonFieldStoryArgs {
  label: string
  text: string
  variant: 'primary' | 'secondary' | 'danger'
  type: 'button' | 'submit' | 'reset'
  disabled: boolean
  loading: boolean
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The ButtonField component provides a button that can be used as a form field.
 * It integrates with the form system and supports various button variants and states.
 */
const meta: Meta<ButtonFieldStoryArgs> = {
  title: 'Forms/ButtonField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label (fallback if text not provided)' },
    text: { control: 'text', description: 'Button text content' },
    variant: {
      control: 'radio',
      options: ['primary', 'secondary', 'danger'],
      description: 'Button variant style',
    },
    type: {
      control: 'radio',
      options: ['button', 'submit', 'reset'],
      description: 'Button HTML type',
    },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    loading: { control: 'boolean', description: 'Show loading state?' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
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
    label: 'Action Button',
    text: 'Click Me',
    variant: 'primary',
    type: 'button',
    disabled: false,
    loading: false,
    readOnly: false,
    readOnlyStyle: 'value',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: false, // Buttons don't typically need form state display
  },
  render: (args) => {
    const field = {
      key: 'storybookButtonField' as const,
      type: FormFieldType.Button as const,
      options: {
        label: args.label,
        text: args.text,
        variant: args.variant,
        type: args.type,
        disabled: args.disabled,
        loading: args.loading,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        onClick: () => {
          console.log('Button clicked!')
        },
      },
    }

    return (
      <StorybookFieldWrapper
        field={field}
        hasError={false}
        errorMessage=""
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
        showState={args.showState}
      />
    )
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  name: 'Primary Button',
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Click Me' })
    await expect(buttonElement).toBeInTheDocument()
    await expect(buttonElement).toBeEnabled()
    
    // Test clicking
    await userEvent.click(buttonElement)
    // Note: The click handler just logs to console, so we can't test its effect here
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    text: 'Secondary Action',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Secondary Action' })
    await expect(buttonElement).toBeInTheDocument()
    await expect(buttonElement).toBeEnabled()
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    text: 'Delete Item',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Delete Item' })
    await expect(buttonElement).toBeInTheDocument()
    await expect(buttonElement).toBeEnabled()
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    text: 'Disabled Button',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Disabled Button' })
    await expect(buttonElement).toBeDisabled()
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    text: 'Save Changes',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Processing...' })
    await expect(buttonElement).toBeDisabled()
    await expect(buttonElement).toHaveTextContent('Processing...')
  },
}

export const SubmitButton: Story = {
  args: {
    type: 'submit',
    text: 'Submit Form',
    variant: 'primary',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Submit Form' })
    await expect(buttonElement).toHaveAttribute('type', 'submit')
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    text: 'Hidden in Read-only',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as text, not a button
    const textDisplay = canvas.getByText('Button: Hidden in Read-only')
    await expect(textDisplay).toBeInTheDocument()
    
    // Should not have an interactive button
    const buttonElement = canvas.queryByRole('button')
    await expect(buttonElement).not.toBeInTheDocument()
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    text: 'Read-only Disabled',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Read-only Disabled' })
    
    // Should render as disabled button
    await expect(buttonElement).toBeDisabled()
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    text: 'Form Read-only Button',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // When form is read-only, the button should also be read-only
    const textDisplay = canvas.getByText('Button: Form Read-only Button')
    await expect(textDisplay).toBeInTheDocument()
    
    // Should not have an interactive button
    const buttonElement = canvas.queryByRole('button')
    await expect(buttonElement).not.toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    text: 'Form Read-only (Disabled Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const buttonElement = canvas.getByRole('button', { name: 'Form Read-only (Disabled Style)' })
    
    // Should render as disabled button due to form read-only
    await expect(buttonElement).toBeDisabled()
  },
} 