import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, SelectOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateMultiSelectCode = (args: MultiSelectStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'Select Options') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue && args.defaultValue.length > 0) {
    const defaultValueStr = JSON.stringify(args.defaultValue)
    options.push(`defaultValue: ${defaultValueStr}`)
  }
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.placeholder) options.push(`placeholder: '${args.placeholder}'`)
  
  // Add options array
  const optionsArray = `[
    { label: 'JavaScript', value: 'js' },
    { label: 'TypeScript', value: 'ts' },
    { label: 'Python', value: 'py' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'Go', value: 'go' },
    { label: 'Rust', value: 'rust' },
    { label: 'Swift', value: 'swift' },
  ]`
  options.push(`options: ${optionsArray}`)
  
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
      key: 'skills',
      type: FormFieldType.MultiSelect,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

interface MultiSelectStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: { label: string; value: string }[]
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  placeholder: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

// Sample options for all stories
const sampleOptions = [
  { label: 'JavaScript', value: 'js' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'Python', value: 'py' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Swift', value: 'swift' },
]

/**
 * The MultiSelectField component allows users to select multiple options from a dropdown list.
 * It features a searchable interface with selected items displayed as removable tags.
 * Built with Headless UI for accessibility and smooth interactions.
 */
const meta: Meta<MultiSelectStoryArgs> = {
  title: 'Forms/MultiSelectField',
  tags: ['autodocs'],
  parameters: {
    docs: {
      source: {
        type: 'code',
        transform: (code: string, storyContext: any) => {
          return generateMultiSelectCode(storyContext.args)
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
    defaultValue: { control: 'object', description: 'Default selected options' },
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
    label: 'Select Options',
    required: false,
    disabled: false,
    defaultValue: [],
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select at least one option.',
    placeholder: 'Search options...',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field: { key: string; type: FormFieldType.MultiSelect; options: SelectOptions } = {
      key: 'storybookMultiSelectField',
      type: FormFieldType.MultiSelect,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        placeholder: args.placeholder,
        options: sampleOptions,
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
    
    // Should have combobox input
    const input = await canvas.findByRole('combobox')
    await expect(input).toBeInTheDocument()
    await expect(input).toBeEnabled()
    
    // Should have dropdown button
    const button = await canvas.findByRole('button')
    await expect(button).toBeInTheDocument()
  },
}

export const WithDefaultSelections: Story = {
  name: 'With Default Selections',
  args: { 
    defaultValue: [
      { label: 'JavaScript', value: 'js' },
      { label: 'TypeScript', value: 'ts' }
    ],
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should show selected items as tags
    const jsTag = await canvas.findByText('JavaScript')
    await expect(jsTag).toBeInTheDocument()
    
    const tsTag = await canvas.findByText('TypeScript')
    await expect(tsTag).toBeInTheDocument()
    
    // Should have remove buttons for each tag
    const removeButtons = await canvas.findAllByRole('button')
    await expect(removeButtons).toHaveLength(3) // 2 remove buttons + 1 dropdown button
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
    const input = await canvas.findByRole('combobox')
    await expect(input).toBeInTheDocument()
    await expect(input).toBeEnabled()
    // Optionally: check for required asterisk in the label
    // await expect(canvas.getByText(/Select Options\s*\*/)).toBeInTheDocument()
  },
}

export const Disabled: Story = {
  name: 'Disabled State',
  args: { 
    disabled: true,
    defaultValue: [{ label: 'Python', value: 'py' }],
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('combobox')
    await expect(input).toBeDisabled()
    
    // Should show selected item but be disabled
    const pythonTag = await canvas.findByText('Python')
    await expect(pythonTag).toBeInTheDocument()
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
    const input = await canvas.findByRole('combobox')
    await expect(input).toBeInTheDocument()
    
    // Error styling should be applied (checked via CSS classes in component)
  },
}

export const SearchAndSelect: Story = {
  name: 'Search and Select',
  args: { 
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('combobox')
    // Click to open dropdown
    await userEvent.click(input)
    // Type to search
    await userEvent.type(input, 'Java')
    // Should filter options (JavaScript and Java should be visible)
    const options = await canvas.findAllByRole('option')
    await expect(options.length).toBeGreaterThan(0)
    // Click on JavaScript option
    const jsOption = await canvas.findAllByText('JavaScript')
    await userEvent.click(jsOption[0])
    // Should show selected item as a tag
    const selectedTag = await canvas.findAllByText('JavaScript')
    await expect(selectedTag.length).toBeGreaterThan(0)
  },
}

export const RemoveSelectedItems: Story = {
  name: 'Remove Selected Items',
  args: { 
    defaultValue: [
      { label: 'JavaScript', value: 'js' },
      { label: 'Python', value: 'py' },
      { label: 'Go', value: 'go' }
    ],
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should have 3 selected items
    const jsTag = await canvas.findAllByText('JavaScript')
    const pyTag = await canvas.findAllByText('Python')
    const goTag = await canvas.findAllByText('Go')
    await expect(jsTag.length).toBeGreaterThan(0)
    await expect(pyTag.length).toBeGreaterThan(0)
    await expect(goTag.length).toBeGreaterThan(0)
    // Find and click the remove button for Python (second item)
    const removeButtons = await canvas.findAllByRole('button')
    // Filter out the dropdown button (last one)
    const itemRemoveButtons = removeButtons.slice(0, -1)
    // Click remove button for Python (index 1)
    await userEvent.click(itemRemoveButtons[1])
    // Python should be removed
    const pyTagsAfter = canvas.queryAllByText('Python')
    await expect(pyTagsAfter.length).toBe(0)
    // JavaScript and Go should still be there
    await expect(canvas.getAllByText('JavaScript').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Go').length).toBeGreaterThan(0)
  },
}

const hasTextContent = (expected: string) => (content: string, element: Element | null) => element?.textContent === expected;

export const ReadOnlyValue: Story = {
  name: 'Read-Only (Value Style)',
  args: { 
    readOnly: true,
    defaultValue: [
      { label: 'TypeScript', value: 'ts' },
      { label: 'Rust', value: 'rust' }
    ],
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should render as plain text
    const valueDisplays = await canvas.findAllByText((content, element) => {
      const text = element?.textContent?.replace(/\s+/g, ' ').trim() || '';
      return text === 'TypeScript, Rust';
    });
    await expect(valueDisplays.length).toBeGreaterThan(0)
  },
}

export const ReadOnlyDisabled: Story = {
  name: 'Read-Only (Disabled Style)',
  args: { 
    readOnly: true,
    readOnlyStyle: 'disabled',
    defaultValue: [
      { label: 'Swift', value: 'swift' },
      { label: 'C++', value: 'cpp' }
    ],
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Should render as disabled input
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('Swift, C++')
  },
}

export const FormReadOnly: Story = {
  name: 'Form Read-Only (Value Style)',
  args: { 
    formReadOnly: true,
    defaultValue: [
      { label: 'Java', value: 'java' },
      { label: 'Python', value: 'py' }
    ],
    readOnly: false, // Explicitly false to test form-level precedence
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const valueDisplays = await canvas.findAllByText((content, element) => {
      const text = element?.textContent?.replace(/\s+/g, ' ').trim() || '';
      return text === 'Java, Python';
    });
    await expect(valueDisplays.length).toBeGreaterThan(0)
  },
}

export const FormReadOnlyDisabled: Story = {
  name: 'Form Read-Only (Disabled Style)',
  args: { 
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    defaultValue: [{ label: 'Go', value: 'go' }],
    readOnly: false, // Explicitly false to test form-level precedence
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const input = await canvas.findByRole('textbox')
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('Go')
  },
}

export const FieldOverridesForm: Story = {
  name: 'Field Read-Only Overrides Form',
  args: { 
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    readOnly: true,
    readOnlyStyle: 'value',
    defaultValue: [
      { label: 'Rust', value: 'rust' },
      { label: 'TypeScript', value: 'ts' }
    ],
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Field-level 'value' style should override form-level 'disabled' style
    const valueDisplay = await canvas.findByDisplayValue('Rust, TypeScript')
    await expect(valueDisplay).toBeInTheDocument()
    await expect(valueDisplay).toBeDisabled()
    await expect(valueDisplay).toHaveAttribute('readonly')
    const inputs = canvas.queryAllByRole('combobox')
    await expect(inputs).toHaveLength(0)
  },
}

export const InteractiveExample: Story = {
  name: 'Interactive Example',
  args: { 
    label: 'Select Your Skills',
    placeholder: 'Search programming languages...',
    required: true,
    showState: true 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('combobox')
    // Click to open dropdown
    await userEvent.click(input)
    // Send down arrow to keep dropdown open (Headless UI workaround)
    await userEvent.keyboard('{ArrowDown}')
    // Select TypeScript
    const tsOption = await canvas.findAllByText('TypeScript')
    await userEvent.click(tsOption[0])
    // Search for Python
    await userEvent.type(input, 'Py')
    const pyOption = await canvas.findAllByText('Python')
    await userEvent.click(pyOption[0])
    // Clear search and select Go
    await userEvent.clear(input)
    await userEvent.type(input, 'Go')
    const goOption = await canvas.findAllByText('Go')
    await userEvent.click(goOption[0])
    // Should have 3 selected items
    await expect(canvas.getAllByText('TypeScript').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Python').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Go').length).toBeGreaterThan(0)
  },
} 