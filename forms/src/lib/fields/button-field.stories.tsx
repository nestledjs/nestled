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
  showState: boolean
  fullWidth: boolean
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
    showState: { control: 'boolean', description: 'Show live form state?' },
    fullWidth: { control: 'boolean', description: 'Make the button full width?' },
  },
  args: {
    label: 'Action Button',
    text: 'Click Me',
    variant: 'primary',
    type: 'button',
    disabled: false,
    loading: false,
    showState: false,
    fullWidth: false,
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
        fullWidth: args.fullWidth,
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
    await userEvent.click(buttonElement)
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

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    text: 'Full Width Button',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const buttonElement = canvas.getByRole('button', { name: 'Full Width Button' })
    await expect(buttonElement).toBeInTheDocument()
    // You may want to add a visual regression test here if you use one
  },
} 