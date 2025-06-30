import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, EmailFieldOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateEmailFieldCode = (args: EmailFieldStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'Email Address') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue) options.push(`defaultValue: '${args.defaultValue}'`)
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.placeholder && args.placeholder !== 'Enter your email address') options.push(`placeholder: '${args.placeholder}'`)
  
  const formProps: string[] = []
  if (args.formReadOnly) formProps.push('readOnly={true}')
  if (args.formReadOnlyStyle !== 'value') formProps.push(`readOnlyStyle="${args.formReadOnlyStyle}"`)
  
  const optionsString = options.length > 0 ? `
        ${options.join(',\n        ')},` : ''
  
  const formPropsString = formProps.length > 0 ? `\n  ${formProps.join('\n  ')}` : ''
  
  const code = `<Form
  id="example-form"${formPropsString}
  fields={[
    {
      key: 'userEmail',
      type: FormFieldType.Email,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

interface EmailFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: string
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  placeholder: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The EmailField component is specifically designed for capturing email addresses.
 * It provides built-in email validation and uses the HTML5 email input type for
 * better user experience on mobile devices.
 */
const meta: Meta<EmailFieldStoryArgs> = {
  title: 'Forms/EmailField',
  tags: ['autodocs'],
  parameters: {
    docs: {
      source: {
        type: 'code',
        transform: (code: string, storyContext: any) => {
          return generateEmailFieldCode(storyContext.args)
        },
      },
      story: {
        inline: true,
        autoplay: false,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default email value' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
  args: {
    label: 'Email Address',
    required: false,
    disabled: false,
    defaultValue: '',
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please enter a valid email address.',
    placeholder: 'Enter your email address',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field: { key: string; type: FormFieldType.Email; options: EmailFieldOptions } = {
      key: 'storybookEmailField',
      type: FormFieldType.Email,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue || undefined,
        // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        placeholder: args.placeholder,
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
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeInTheDocument()
    await expect(input).toHaveAttribute('type', 'email')
    await expect(input).toHaveAttribute('autocomplete', 'email')
    await expect(input).toBeEnabled()
  },
}

export const WithDefaultValue: Story = {
  name: 'With Default Value',
  args: { 
    defaultValue: 'user@example.com',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByDisplayValue('user@example.com')
    await expect(input).toBeInTheDocument()
  },
}

export const Required: Story = {
  name: 'Required Field',
  args: { 
    required: true,
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeRequired()
    
    // Test typing a valid email
    await userEvent.type(input, 'test@example.com')
    await expect(input).toHaveValue('test@example.com')
  },
}

export const Disabled: Story = {
  name: 'Disabled State',
  args: { 
    disabled: true,
    defaultValue: 'disabled@example.com',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('disabled@example.com')
  },
}

export const WithError: Story = {
  name: 'Error State',
  args: { 
    hasError: true,
    required: true,
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeInTheDocument()
    
    // Test typing an invalid email format
    await userEvent.type(input, 'invalid-email')
    await expect(input).toHaveValue('invalid-email')
  },
}

export const ReadOnlyValue: Story = {
  name: 'Read-Only (Value Style)',
  args: { 
    readOnly: true,
    defaultValue: 'readonly@example.com',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should render as a div with the value, not an input
    const valueDisplay = await canvas.findByText('readonly@example.com')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an input field
    const inputs = canvas.queryAllByRole('textbox')
    await expect(inputs).toHaveLength(0)
  },
}

export const ReadOnlyDisabled: Story = {
  name: 'Read-Only (Disabled Style)',
  args: { 
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: 'readonly@example.com',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('readonly@example.com')
    await expect(input).toHaveAttribute('readonly')
  },
}

export const FormReadOnly: Story = {
  name: 'Form Read-Only (Value Style)',
  args: { 
    formReadOnly: true,
    defaultValue: 'form-readonly@example.com',
    readOnly: false, // Explicitly false to test form-level precedence
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const valueDisplay = await canvas.findByText('form-readonly@example.com')
    await expect(valueDisplay).toBeInTheDocument()
    
    const inputs = canvas.queryAllByRole('textbox')
    await expect(inputs).toHaveLength(0)
  },
}

export const FormReadOnlyDisabled: Story = {
  name: 'Form Read-Only (Disabled Style)',
  args: { 
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: 'form-readonly@example.com',
    readOnly: false, // Explicitly false to test form-level precedence
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('form-readonly@example.com')
  },
}

export const FieldOverridesForm: Story = {
  name: 'Field Read-Only Overrides Form',
  args: { 
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 'override@example.com',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Field-level 'value' style should override form-level 'disabled' style
    const input = await canvas.findByDisplayValue('override@example.com')
    await expect(input).toBeInTheDocument()
    await expect(input).toBeDisabled()
  },
}

export const InteractiveExample: Story = {
  name: 'Interactive Example',
  args: { 
    label: 'Your Email',
    placeholder: 'you@company.com',
    required: true,
    showState: true 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('textbox')
    
    // Test typing a complete email
    await userEvent.type(input, 'user@example.com')
    await expect(input).toHaveValue('user@example.com')
    
    // Clear and test incomplete email
    await userEvent.clear(input)
    await userEvent.type(input, 'incomplete@')
    await expect(input).toHaveValue('incomplete@')
  },
} 