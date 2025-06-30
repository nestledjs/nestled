import type { Meta, StoryObj } from '@storybook/react'
import { Button, ButtonProps } from './button'
import { ThemeContext } from '../theme-context'
import { createFinalTheme } from '../utils/resolve-theme'
import { expect, within, userEvent, fn } from 'storybook/test'

// A simple wrapper for stories to provide the ThemeContext.
const ButtonStoryWrapper = (props: ButtonProps) => {
  // In a real app, the <Form> component would do this.
  // For isolated button stories, we do it here.
  const finalTheme = createFinalTheme()

  return (
    <ThemeContext.Provider value={finalTheme}>
      <Button {...props} />
    </ThemeContext.Provider>
  )
}

/**
 * The Button component is the standard interactive element for form submission
 * and other actions. Its appearance is controlled by the `button` section of the form theme.
 */
const meta: Meta<ButtonProps & { fullWidth?: boolean }> = {
  title: 'Forms/Button',
  component: ButtonStoryWrapper,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'The stylistic variant of the button.',
    },
    loading: {
      control: 'boolean',
      description: 'Shows a loading state and disables the button.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button.',
    },
    children: {
      control: 'text',
      description: 'The content of the button.',
    },
    onClick: { action: 'clicked' },
    fullWidth: {
      control: 'boolean',
      description: 'Make the button full width?',
    },
  },
  args: {
    children: 'Click Me',
    variant: 'primary',
    loading: false,
    disabled: false,
    onClick: fn(),
    fullWidth: false,
  },
}
export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: /primary button/i })
    await expect(button).toBeInTheDocument()
    await expect(button).toBeEnabled()
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalled()
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: /secondary button/i })
    await expect(button).toBeInTheDocument()
    await expect(button).toBeEnabled()
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalled()
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: /danger button/i })
    await expect(button).toBeInTheDocument()
    await expect(button).toBeEnabled()
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  name: 'State: Disabled',
  args: {
    disabled: true,
    children: 'Disabled',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: /disabled/i })
    await expect(button).toBeDisabled()
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const Loading: Story = {
  name: 'State: Loading',
  args: {
    loading: true,
    children: 'This text is replaced',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button')
    await expect(button).toHaveTextContent(/processing/i)
    await expect(button).toBeDisabled()
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: /full width button/i })
    await expect(button).toBeInTheDocument()
    // You may want to add a visual regression test here if you use one
  },
}
