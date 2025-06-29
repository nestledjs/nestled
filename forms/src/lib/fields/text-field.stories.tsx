import type { Meta, StoryObj } from '@storybook/react'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { FormFieldType, FormField } from '../form-types'

// Define the flat controls for the Storybook UI. This is our `args` type.
interface TextFieldStoryArgs {
  label: string
  placeholder: string
  required: boolean
  disabled: boolean
  defaultValue: string
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  labelDisplay: 'default' | 'all' | 'none'
  showState: boolean
}

/**
 * The `TextField` is the most basic input field for capturing short-form text.
 *
 * This story renders the component through the `StorybookFieldWrapper`, which
 * provides the necessary `FormContext`, `ThemeContext`, and `FormConfigContext`.
 * This ensures that the component is tested in an environment that accurately
 * mirrors its real-world usage, including label rendering, error states, and
 * theming.
 */
const meta: Meta<TextFieldStoryArgs> = {
  title: 'Forms/TextField',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: "The field's visible label.",
      table: { category: 'Field Options' },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input.',
      table: { category: 'Field Options' },
    },
    required: {
      control: 'boolean',
      description: 'Is the field required? (Adds a red asterisk).',
      table: { category: 'Field Options' },
    },
    disabled: {
      control: 'boolean',
      description: 'Is the input element disabled?',
      table: { category: 'Field Options' },
    },
    defaultValue: {
      control: 'text',
      description: 'The initial value of the field.',
      table: { category: 'Field Options' },
    },
    readOnly: {
      control: 'boolean',
      description: 'Puts this specific field in read-only mode.',
      table: { category: 'Field Options' },
    },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'The style for this specific field when read-only.',
      table: { category: 'Field Options' },
    },
    hasError: {
      control: 'boolean',
      description: 'Simulates a validation error on the field.',
      table: { category: 'Form State' },
    },
    errorMessage: {
      control: 'text',
      description: 'The error message to display when `hasError` is true.',
      table: { category: 'Form State' },
    },
    formReadOnly: {
      control: 'boolean',
      description: 'Puts the entire form in read-only mode.',
      table: { category: 'Form State' },
    },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'The global read-only style for the entire form.',
      table: { category: 'Form State' },
    },
    labelDisplay: {
      control: 'select',
      options: ['default', 'all', 'none'],
      description: 'Global label visibility for the entire form.',
      table: { category: 'Form State' },
    },
    showState: {
      control: 'boolean',
      description: 'Show or hide the live form state debugger.',
      table: { category: 'Storybook' },
    },
  },
  args: {
    label: 'Your Name',
    placeholder: 'e.g., Jane Doe',
    required: false,
    disabled: false,
    defaultValue: '',
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'This field is required.',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    labelDisplay: 'default',
    showState: false,
  },
  render: (args) => {
    const field: FormField = {
      key: 'storybookTextField',
      type: FormFieldType.Input,
      options: {
        label: args.label,
        placeholder: args.placeholder,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        readOnly: args.readOnly,
        readOnlyStyle: args.readOnlyStyle,
      },
    }
    return (
      <StorybookFieldWrapper
        field={field}
        hasError={args.hasError}
        errorMessage={args.errorMessage}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
        labelDisplay={args.labelDisplay}
        showState={args.showState}
      />
    )
  },
}
export default meta

type Story = StoryObj<typeof meta>

// --- Individual Stories for Different States ---

export const Default: Story = {
  name: 'Default State',
  args: {
    showState: true,
  },
}

export const Required: Story = {
  name: 'Required Field',
  args: {
    label: 'Required Field',
    required: true,
  },
}

export const Disabled: Story = {
  name: 'Disabled State',
  args: {
    label: 'Disabled Field',
    disabled: true,
    defaultValue: 'Cannot be edited',
  },
}

export const WithError: Story = {
  name: 'Error State',
  args: {
    label: 'Field With Error',
    required: true,
    hasError: true,
  },
}

export const ReadOnlyAsValue: Story = {
  name: 'Read-Only (as Value)',
  args: {
    label: 'Read-Only Field',
    defaultValue: 'This is a final value.',
    readOnly: true,
    readOnlyStyle: 'value',
  },
}

export const ReadOnlyAsDisabled: Story = {
  name: 'Read-Only (as Disabled Input)',
  args: {
    label: 'Read-Only Field',
    defaultValue: 'This is a final value.',
    readOnly: true,
    readOnlyStyle: 'disabled',
  },
}

export const NoLabel: Story = {
  name: 'Global No-Label Mode',
  args: {
    label: 'Label (Hidden by Global Config)',
    labelDisplay: 'none',
  },
}
