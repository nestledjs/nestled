import type { Meta, StoryObj } from '@storybook/react'
import { FormLabel } from './label'
import { ThemeContext } from '../theme-context'
import { createFinalTheme } from '../utils/resolve-theme'

interface LabelStoryArgs {
  htmlFor: string
  label: string
  required: boolean
}

// Simple wrapper for stories to provide the ThemeContext
const LabelStoryWrapper = (props: LabelStoryArgs) => {
  const finalTheme = createFinalTheme()

  return (
    <ThemeContext.Provider value={finalTheme}>
      <div className="space-y-4">
        <FormLabel {...props} />
        {/* Show a sample input to demonstrate the label connection */}
        <input
          id={props.htmlFor}
          type="text"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
          placeholder="Sample input to show label connection"
        />
      </div>
    </ThemeContext.Provider>
  )
}

/**
 * The FormLabel component provides consistent labeling for form fields.
 * It automatically handles required field indicators and integrates with the form theme.
 */
const meta: Meta<LabelStoryArgs> = {
  title: 'Forms/FormLabel',
  component: LabelStoryWrapper,
  tags: ['autodocs'],
  argTypes: {
    htmlFor: {
      control: 'text',
      description: 'The ID of the form field this label is associated with.',
    },
    label: {
      control: 'text',
      description: 'The text content of the label.',
    },
    required: {
      control: 'boolean',
      description: 'Whether to show the required indicator (red asterisk).',
    },
  },
  args: {
    htmlFor: 'sample-field',
    label: 'Sample Field',
    required: false,
  },
}
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default Label',
  args: {
    label: 'Field Label',
  },
}

export const Required: Story = {
  name: 'Required Field Label',
  args: {
    label: 'Required Field',
    required: true,
  },
}

export const LongLabel: Story = {
  name: 'Long Label Text',
  args: {
    label: 'This is a longer field label that demonstrates how labels wrap and display',
    required: true,
  },
} 