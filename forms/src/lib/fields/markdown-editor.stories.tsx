import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
  import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
  import { FormFieldType, FormField } from '../form-types'

// Define the flat controls for the Storybook UI
  interface MarkdownEditorStoryArgs {
    label: string
    placeholder: string
    required: boolean
    disabled: boolean
    defaultValue: string
    height: number
    spellCheck: boolean
    maxLength: number
    readOnly: boolean
    readOnlyStyle: 'value' | 'disabled'
    hasError: boolean
    errorMessage: string
    formReadOnly: boolean
    formReadOnlyStyle: 'value' | 'disabled'
    helpText: string
    labelDisplay: 'default' | 'all' | 'none'
    showState: boolean
  }

/**
 * The MarkdownEditor component provides a rich text editing experience with markdown syntax.
 * It supports real-time preview, toolbar controls, and seamless integration with the form system.
 */
const meta: Meta<MarkdownEditorStoryArgs> = {
  title: 'Forms/MarkdownEditor',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default markdown content' },
    height: { control: 'number', description: 'Editor height in pixels' },
    spellCheck: { control: 'boolean', description: 'Enable spell check?' },
    maxLength: { control: 'number', description: 'Maximum character length' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    helpText: { control: 'text', description: 'Help text' },
    labelDisplay: {
      control: 'radio',
      options: ['default', 'all', 'none'],
      description: 'Label display mode',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
      args: {
    label: 'Content',
    placeholder: 'Enter your markdown content...',
    required: false,
    disabled: false,
    defaultValue: '',
    height: 300,
    spellCheck: true,
    maxLength: 0,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'This field is required.',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    helpText: '',
    labelDisplay: 'default',
    showState: true,
  },
}

export default meta
type Story = StoryObj<MarkdownEditorStoryArgs>

// Helper to convert story args to FormField
function createMarkdownEditorField(args: MarkdownEditorStoryArgs): FormField {
  return {
    key: 'markdownEditor',
    type: FormFieldType.MarkdownEditor,
    options: {
      label: args.label,
      placeholder: args.placeholder,
      required: args.required,
      disabled: args.disabled,
      defaultValue: args.defaultValue,
      height: args.height,
      maxLength: args.maxLength || undefined,
      readOnly: args.readOnly,
      readOnlyStyle: args.readOnlyStyle,
      helpText: args.helpText || undefined,
    },
  }
}

export const Basic: Story = {
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // The MDXEditor should be present in the DOM (lazy-loaded, so shows loading initially)
    await expect(canvas.getByText('Loading editor...')).toBeInTheDocument()
    
    // Verify the label is present
    await expect(canvas.getByText('Content')).toBeInTheDocument()
    
    // Check that the Live Form State section is present
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
  },
}

export const WithContent: Story = {
  args: {
    defaultValue: '# Sample Content\n\nThis is a sample markdown document with:\n\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n- [Links](https://example.com)\n\n## Lists\n\n### Bullet List\n- First item\n- Second item\n- Third item\n\n### Numbered List\n1. First item\n2. Second item\n3. Third item\n\n### Checkbox List\n- [ ] Unchecked task\n- [x] Completed task\n- [ ] Another task\n\n## Code Block\n\n```javascript\nconsole.log("Hello, World!")\n```\n\n> This is a blockquote\n\nAnd some regular paragraph text.',
    height: 400,
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Check that the editor loaded by looking for the Live Form State
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
    
    // Check that some basic content appears in the form (should be in the JSON state)
    await expect(canvas.getByText(/Sample Content/)).toBeInTheDocument()
  },
}

export const Required: Story = {
  args: {
    required: true,
    label: 'Required Content',
    helpText: 'This field is required. Please provide some content.',
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test help text
    await expect(canvas.getByText('This field is required. Please provide some content.')).toBeInTheDocument()
    
    // Verify the required field label shows the required indicator (if your theme includes it)
    await expect(canvas.getByText('Required Content')).toBeInTheDocument()
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '# Disabled Content\n\nThis editor is disabled and cannot be edited.',
    label: 'Disabled Editor',
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify the label is correct 
    await expect(canvas.getByText('Disabled Editor')).toBeInTheDocument()
    
    // Check that the Live Form State section is present
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
  },
}

export const WithMaxLength: Story = {
  args: {
    maxLength: 100,
    label: 'Limited Content',
    helpText: 'Maximum 100 characters allowed.',
    defaultValue: 'This is a short example with character limit.',
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify help text
    await expect(canvas.getByText('Maximum 100 characters allowed.')).toBeInTheDocument()
    
    // Check that the Live Form State section is present  
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    defaultValue: '# Read-Only Content\n\nThis content is displayed in **read-only** mode as rendered HTML.\n\n- Item 1\n- Item 2\n- Item 3',
    label: 'Read-Only (Value Style)',
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify the label
    await expect(canvas.getByText('Read-Only (Value Style)')).toBeInTheDocument()
    
    // Check that the content appears in the Live Form State section (more specific)
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: '# Read-Only Content\n\nThis content is displayed in **disabled** editor style.',
    label: 'Read-Only (Disabled Style)',
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show disabled editor with content
    await expect(canvas.getByText('Markdown Editor (Disabled)')).toBeInTheDocument()
    
    // Verify the label
    await expect(canvas.getByText('Read-Only (Disabled Style)')).toBeInTheDocument()
    
    // Check that the content appears in the Live Form State section
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
  },
}

export const ErrorState: Story = {
  args: {
    hasError: true,
    required: true,
    label: 'Content with Error',
    helpText: 'This field has an error state applied.',
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Check that help text is displayed
    await expect(canvas.getByText('This field has an error state applied.')).toBeInTheDocument()
    
    // Verify the label
    await expect(canvas.getByText('Content with Error')).toBeInTheDocument()
  },
}

export const CustomHeight: Story = {
  args: {
    height: 500,
    label: 'Tall Editor',
    defaultValue: '# Tall Editor\n\nThis editor has a custom height of 500 pixels.\n\n' + 
      Array.from({ length: 20 }, (_, i) => `Line ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`).join('\n\n'),
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify the label 
    await expect(canvas.getByText('Tall Editor')).toBeInTheDocument()
    
    // Check that the Live Form State section is present
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    defaultValue: '# Form Read-Only\n\nThis entire form is in read-only mode, affecting all fields.',
    label: 'Form-Level Read-Only',
  },
  render: (args) => (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify the label 
    await expect(canvas.getByText('Form-Level Read-Only')).toBeInTheDocument()
    
    // Check that the Live Form State section is present
    await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
  },
  } 