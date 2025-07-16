import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from 'storybook/test'
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

// Common render function to reduce duplication
function renderMarkdownEditor(args: MarkdownEditorStoryArgs) {
  return (
    <StorybookFieldWrapper
      field={createMarkdownEditorField(args)}
      hasError={args.hasError}
      errorMessage={args.errorMessage}
      formReadOnly={args.formReadOnly}
      formReadOnlyStyle={args.formReadOnlyStyle}
      labelDisplay={args.labelDisplay}
      showState={args.showState}
    />
  )
}

// Common test utilities
async function expectLabelToBePresent(canvas: ReturnType<typeof within>, labelText: string) {
  await expect(canvas.getByText(labelText)).toBeInTheDocument()
}

async function expectLiveFormStateToBePresent(canvas: ReturnType<typeof within>) {
  await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
}

async function expectLoadingEditorInitially(canvas: ReturnType<typeof within>) {
  await expect(canvas.getByText('Loading editor...')).toBeInTheDocument()
}

async function expectBasicFieldElements(canvas: ReturnType<typeof within>, labelText: string) {
  await expectLabelToBePresent(canvas, labelText)
  await expectLiveFormStateToBePresent(canvas)
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

export const Basic: Story = {
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // The MDXEditor should be present in the DOM (lazy-loaded, so shows loading initially)
    await expectLoadingEditorInitially(canvas)
    
    // Verify basic elements
    await expectBasicFieldElements(canvas, 'Content')
  },
}

export const WithContent: Story = {
  args: {
    defaultValue: '# Sample Content\n\nThis is a sample markdown document with:\n\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n- [Links](https://example.com)\n\n## Lists\n\n### Bullet List\n- First item\n- Second item\n- Third item\n\n### Numbered List\n1. First item\n2. Second item\n3. Third item\n\n### Checkbox List\n- [ ] Unchecked task\n- [x] Completed task\n- [ ] Another task\n\n## Code Block\n\n```javascript\nconsole.log("Hello, World!")\n```\n\n> This is a blockquote\n\nAnd some regular paragraph text.',
    height: 400,
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Check that the editor loaded by looking for the Live Form State
    await expectLiveFormStateToBePresent(canvas)
    
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
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test help text
    await expect(canvas.getByText('This field is required. Please provide some content.')).toBeInTheDocument()
    
    // Verify the required field label shows the required indicator (if your theme includes it)
    await expectLabelToBePresent(canvas, 'Required Content')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '# Disabled Content\n\nThis editor is disabled and cannot be edited.',
    label: 'Disabled Editor',
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    await expectBasicFieldElements(canvas, 'Disabled Editor')
  },
}

export const WithMaxLength: Story = {
  args: {
    maxLength: 100,
    label: 'Limited Content',
    helpText: 'Maximum 100 characters allowed.',
    defaultValue: 'This is a short example with character limit.',
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify help text
    await expect(canvas.getByText('Maximum 100 characters allowed.')).toBeInTheDocument()
    
    await expectLiveFormStateToBePresent(canvas)
  },
}

export const ReadOnlyValue: Story = {
  args: {
    readOnly: true,
    defaultValue: '# Read-Only Content\n\nThis content is displayed in **read-only** mode as rendered HTML.\n\n- Item 1\n- Item 2\n- Item 3',
    label: 'Read-Only (Value Style)',
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    await expectBasicFieldElements(canvas, 'Read-Only (Value Style)')
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: '# Read-Only Content\n\nThis content is displayed in **disabled** editor style.',
    label: 'Read-Only (Disabled Style)',
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show disabled editor with content
    await expect(canvas.getByText('Markdown Editor (Disabled)')).toBeInTheDocument()
    
    await expectBasicFieldElements(canvas, 'Read-Only (Disabled Style)')
  },
}

export const ErrorState: Story = {
  args: {
    hasError: true,
    required: true,
    label: 'Content with Error',
    helpText: 'This field has an error state applied.',
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Check that help text is displayed
    await expect(canvas.getByText('This field has an error state applied.')).toBeInTheDocument()
    
    // Verify the label
    await expectLabelToBePresent(canvas, 'Content with Error')
  },
}

export const CustomHeight: Story = {
  args: {
    height: 500,
    label: 'Tall Editor',
    defaultValue: '# Tall Editor\n\nThis editor has a custom height of 500 pixels.\n\n' + 
      Array.from({ length: 20 }, (_, i) => `Line ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`).join('\n\n'),
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Use a more specific query for the label to avoid ambiguity
    const labelEl = canvas.getByText('Tall Editor', { selector: 'label' })
    expect(labelEl).toBeInTheDocument()
    await expectLiveFormStateToBePresent(canvas)
  },
}

export const FormReadOnly: Story = {
  args: {
    formReadOnly: true,
    defaultValue: '# Form Read-Only\n\nThis entire form is in read-only mode, affecting all fields.',
    label: 'Form-Level Read-Only',
  },
  render: renderMarkdownEditor,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    await expectBasicFieldElements(canvas, 'Form-Level Read-Only')
  },
} 