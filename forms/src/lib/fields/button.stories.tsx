import type { Meta, StoryObj } from '@storybook/react'
import { Button, ButtonProps } from './button'
import { ThemeContext } from '../theme-context'
import { createFinalTheme } from '../utils/resolve-theme'

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
const meta: Meta<ButtonProps> = {
  title: 'Forms/Button',
  component: ButtonStoryWrapper, // We point to the wrapper for rendering
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
  },
  args: {
    children: 'Click Me',
    variant: 'primary',
    loading: false,
    disabled: false,
  },
}
export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
}

export const Disabled: Story = {
  name: 'State: Disabled',
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

export const Loading: Story = {
  name: 'State: Loading',
  args: {
    loading: true,
    children: 'This text is replaced',
  },
}
