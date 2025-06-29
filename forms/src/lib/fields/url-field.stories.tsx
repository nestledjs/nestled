import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { FormFieldType } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

interface UrlFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  placeholder?: string
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
 * The URLField component provides a URL input using the HTML url input element.
 * It includes built-in URL validation and formatting features provided by the browser.
 */
const meta: Meta<UrlFieldStoryArgs> = {
  title: 'Forms/URLField',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    defaultValue: { control: 'text', description: 'Default URL value' },
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
    label: 'Website URL',
    required: false,
    disabled: false,
    placeholder: undefined,
    defaultValue: undefined,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please enter a valid URL.',
    helpText: undefined,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field = {
      key: 'storybookUrlField' as const,
      type: FormFieldType.Url as const,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        placeholder: args.placeholder,
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
    
    const urlInput = canvas.getByLabelText('Website URL')
    await expect(urlInput).toBeInTheDocument()
    await expect(urlInput).toBeEnabled()
    await expect(urlInput).toHaveAttribute('type', 'url')
    await expect(urlInput).toHaveValue('')
    
    // Test entering a URL
    await userEvent.type(urlInput, 'https://example.com')
    await expect(urlInput).toHaveValue('https://example.com')
    
    // Test clearing
    await userEvent.clear(urlInput)
    await expect(urlInput).toHaveValue('')
  },
}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'https://example.com',
    label: 'Company Website',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Company Website')
    await expect(urlInput).toHaveAttribute('placeholder', 'https://example.com')
    
    // Test typing over placeholder
    await userEvent.type(urlInput, 'https://mycompany.com')
    await expect(urlInput).toHaveValue('https://mycompany.com')
  },
}

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'https://nestled.dev',
    label: 'Project URL',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Project URL')
    await expect(urlInput).toHaveValue('https://nestled.dev')
    
    // Test modifying the default value
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://github.com/nestled')
    await expect(urlInput).toHaveValue('https://github.com/nestled')
  },
}

export const Required: Story = {
  args: {
    required: true,
    label: 'Portfolio URL',
    placeholder: 'https://yourportfolio.com',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Portfolio URL *')
    await expect(urlInput).toBeRequired()
    
    // Test entering a required URL
    await userEvent.type(urlInput, 'https://portfolio.example.com')
    await expect(urlInput).toHaveValue('https://portfolio.example.com')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'https://disabled.example.com',
    label: 'Disabled URL',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Disabled URL')
    await expect(urlInput).toBeDisabled()
    await expect(urlInput).toHaveValue('https://disabled.example.com')
    
    // Verify cannot be changed when disabled
    await userEvent.type(urlInput, 'https://changed.com')
    await expect(urlInput).toHaveValue('https://disabled.example.com') // Should remain unchanged
  },
}

export const Error: Story = {
  args: {
    required: true,
    hasError: true,
    label: 'URL with Error',
    placeholder: 'https://example.com',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('URL with Error *')
    await expect(urlInput).toBeRequired()
    
    // Test that input still functions in error state
    await userEvent.type(urlInput, 'https://fixed.example.com')
    await expect(urlInput).toHaveValue('https://fixed.example.com')
  },
}

export const WithHelpText: Story = {
  args: {
    helpText: 'Include the full URL with https://',
    label: 'Social Media URL',
    placeholder: 'https://twitter.com/username',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Social Media URL')
    const helpText = canvas.getByText('Include the full URL with https://')
    
    await expect(urlInput).toBeInTheDocument()
    await expect(helpText).toBeInTheDocument()
    
    // Test functionality
    await userEvent.type(urlInput, 'https://twitter.com/nestled')
    await expect(urlInput).toHaveValue('https://twitter.com/nestled')
  },
}

export const HttpsUrl: Story = {
  args: {
    defaultValue: 'https://secure.example.com',
    label: 'HTTPS URL',
    helpText: 'Secure URLs start with https://',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('HTTPS URL')
    await expect(urlInput).toHaveValue('https://secure.example.com')
    
    // Test modifying HTTPS URL
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://another-secure.com')
    await expect(urlInput).toHaveValue('https://another-secure.com')
  },
}

export const HttpUrl: Story = {
  args: {
    defaultValue: 'http://legacy.example.com',
    label: 'HTTP URL',
    helpText: 'Some legacy systems use http://',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('HTTP URL')
    await expect(urlInput).toHaveValue('http://legacy.example.com')
    
    // Test modifying HTTP URL
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'http://old-system.com')
    await expect(urlInput).toHaveValue('http://old-system.com')
  },
}

export const ApiUrl: Story = {
  args: {
    defaultValue: 'https://api.example.com/v1',
    label: 'API Endpoint',
    helpText: 'API endpoints often include version numbers',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('API Endpoint')
    await expect(urlInput).toHaveValue('https://api.example.com/v1')
    
    // Test modifying API URL
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://api.myservice.com/v2')
    await expect(urlInput).toHaveValue('https://api.myservice.com/v2')
  },
}

export const LongUrl: Story = {
  args: {
    defaultValue: 'https://very-long-domain-name.example.com/path/to/resource?param1=value1&param2=value2',
    label: 'Long URL',
    helpText: 'URLs can be quite long with paths and parameters',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Long URL')
    await expect(urlInput).toHaveValue('https://very-long-domain-name.example.com/path/to/resource?param1=value1&param2=value2')
    
    // Test that long URLs are handled properly
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://another-long-url.com/very/deep/path/structure')
    await expect(urlInput).toHaveValue('https://another-long-url.com/very/deep/path/structure')
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: 'https://readonly.example.com',
    label: 'Read-only URL',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // In read-only value mode, it should render as text, not an input
    const valueDisplay = canvas.getByText('https://readonly.example.com')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive input
    const urlInput = canvas.queryByRole('textbox')
    await expect(urlInput).not.toBeInTheDocument()
  },
}

export const ReadOnlyEmpty: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'value',
    label: 'Empty Read-only URL',
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
    defaultValue: 'https://disabled-readonly.example.com',
    label: 'Read-only Disabled Style',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Read-only Disabled Style')
    
    // Should render as disabled input
    await expect(urlInput).toBeDisabled()
    await expect(urlInput).toHaveValue('https://disabled-readonly.example.com')
    
    // Verify cannot be modified
    await userEvent.type(urlInput, 'https://changed.com')
    await expect(urlInput).toHaveValue('https://disabled-readonly.example.com') // Should remain unchanged
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    defaultValue: 'https://form-readonly.example.com',
    label: 'Form-wide Read-only',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // When form is read-only, the field should also be read-only
    const valueDisplay = canvas.getByText('https://form-readonly.example.com')
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an interactive input
    const urlInput = canvas.queryByRole('textbox')
    await expect(urlInput).not.toBeInTheDocument()
  },
}

export const FormReadOnlyDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: 'https://form-disabled.example.com',
    label: 'Form-wide Read-only (Disabled Style)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Form-wide Read-only (Disabled Style)')
    
    // Should render as disabled input due to form read-only
    await expect(urlInput).toBeDisabled()
    await expect(urlInput).toHaveValue('https://form-disabled.example.com')
  },
}

export const SubdomainUrl: Story = {
  args: {
    defaultValue: 'https://blog.example.com',
    label: 'Subdomain URL',
    helpText: 'Subdomains are common for blogs, APIs, and services',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Subdomain URL')
    await expect(urlInput).toHaveValue('https://blog.example.com')
    
    // Test changing subdomain
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://shop.example.com')
    await expect(urlInput).toHaveValue('https://shop.example.com')
  },
}

export const LocalhostUrl: Story = {
  args: {
    defaultValue: 'http://localhost:3000',
    label: 'Development URL',
    helpText: 'Local development URLs often use localhost',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Development URL')
    await expect(urlInput).toHaveValue('http://localhost:3000')
    
    // Test changing port
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'http://localhost:8080')
    await expect(urlInput).toHaveValue('http://localhost:8080')
  },
}

export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard Navigation Test',
    placeholder: 'https://example.com',
    helpText: 'Use Tab to navigate, Ctrl+A to select all',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const urlInput = canvas.getByLabelText('Keyboard Navigation Test')
    
    // Focus the input
    urlInput.focus()
    await expect(urlInput).toHaveFocus()
    
    // Test typing a URL
    await userEvent.type(urlInput, 'https://keyboard-test.com')
    await expect(urlInput).toHaveValue('https://keyboard-test.com')
    
    // Test selecting all and replacing
    await userEvent.keyboard('{Control>}a{/Control}')
    await userEvent.type(urlInput, 'https://replaced.com')
    await expect(urlInput).toHaveValue('https://replaced.com')
  },
} 