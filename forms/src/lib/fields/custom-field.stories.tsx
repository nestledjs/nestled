import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, CustomFieldOptions, CustomFieldRenderProps } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'
import React, { useState } from 'react'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateCustomFieldCode = (args: CustomFieldStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'Custom Field') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  
  // Add the custom field implementation based on the example type
  const customFieldMap = {
    'simple-input': 'customField: (props) => <input value={props.value || ""} onChange={(e) => props.onChange(e.target.value)} className="border rounded px-3 py-2" />',
    'color-picker': 'customField: (props) => <input type="color" value={props.value || "#000000"} onChange={(e) => props.onChange(e.target.value)} className="w-16 h-10 border rounded" />',
    'rating': 'customField: (props) => <StarRating value={props.value || 0} onChange={props.onChange} />',
    'counter': 'customField: (props) => <Counter value={props.value || 0} onChange={props.onChange} />',
    'rich-text': 'customField: (props) => <RichTextEditor value={props.value || ""} onChange={props.onChange} />',
  }
  
  options.push(customFieldMap[args.exampleType as keyof typeof customFieldMap] || customFieldMap['simple-input'])
  
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
      key: 'customField',
      type: FormFieldType.Custom,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

interface CustomFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
  exampleType: string
  defaultValue?: any
}

// Example Custom Field Components
const SimpleTextInput = ({ value, onChange }: CustomFieldRenderProps<string>) => (
  <input
    type="text"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Enter some text..."
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
)

const ColorPicker = ({ value, onChange }: CustomFieldRenderProps<string>) => (
  <div className="flex items-center gap-3">
    <input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
    />
    <input
      type="text"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      placeholder="#000000"
      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
)

const StarRating = ({ value, onChange }: CustomFieldRenderProps<number>) => {
  const [hover, setHover] = useState(0)
  const rating = value || 0

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition-colors ${
            star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'No rating'}
      </span>
    </div>
  )
}

const Counter = ({ value, onChange }: CustomFieldRenderProps<number>) => {
  const count = value || 0

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, count - 1))}
        className="w-10 h-10 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-lg font-bold"
      >
        −
      </button>
      <span className="text-xl font-semibold min-w-[3rem] text-center">{count}</span>
      <button
        type="button"
        onClick={() => onChange(count + 1)}
        className="w-10 h-10 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-lg font-bold"
      >
        +
      </button>
    </div>
  )
}

const RichTextEditor = ({ value, onChange }: CustomFieldRenderProps<string>) => {
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="flex gap-2 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setIsBold(!isBold)}
          className={`px-3 py-1 rounded text-sm font-bold ${
            isBold ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300'
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => setIsItalic(!isItalic)}
          className={`px-3 py-1 rounded text-sm italic ${
            isItalic ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300'
          }`}
        >
          I
        </button>
      </div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your rich text..."
        className={`w-full p-3 resize-none focus:outline-none ${
          isBold ? 'font-bold' : ''
        } ${isItalic ? 'italic' : ''}`}
        rows={4}
        style={{
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
        }}
      />
    </div>
  )
}

const TagInput = ({ value, onChange }: CustomFieldRenderProps<string[]>) => {
  const tags = value || []
  const [inputValue, setInputValue] = useState('')

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange([...tags, inputValue.trim()])
      setInputValue('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="border border-gray-300 rounded-md p-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Add a tag..."
          className="flex-1 border-0 outline-none"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  )
}

const meta: Meta<CustomFieldStoryArgs> = {
  title: 'Forms/CustomField',
  tags: ['autodocs'],
  parameters: {
    docs: {
      source: {
        type: 'code',
        transform: (code: string, storyContext: any) => {
          // Only transform for stories that don't have custom source code
          if (storyContext.parameters?.docs?.source?.code) {
            return storyContext.parameters.docs.source.code
          }
          return generateCustomFieldCode(storyContext.args)
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
    showState: { control: 'boolean', description: 'Show live form state?' },
    exampleType: {
      control: 'select',
      options: ['simple-input', 'color-picker', 'rating', 'counter', 'rich-text'],
      description: 'Type of custom field example',
    },
  },
  args: {
    label: 'Custom Field',
    required: false,
    disabled: false,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'This field has an error.',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
    exampleType: 'simple-input',
  },
  render: (args) => {
    const customFieldMap = {
      'simple-input': SimpleTextInput,
      'color-picker': ColorPicker,
      'rating': StarRating,
      'counter': Counter,
      'rich-text': RichTextEditor,
    }

    const field: { key: string; type: FormFieldType.Custom; options: CustomFieldOptions<any> } = {
      key: 'storybookCustomField',
      type: FormFieldType.Custom,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        customField: customFieldMap[args.exampleType as keyof typeof customFieldMap] || SimpleTextInput,
        defaultValue: args.exampleType === 'rating' ? 3 : args.exampleType === 'counter' ? 5 : args.exampleType === 'color-picker' ? '#3b82f6' : undefined,
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

export const SimpleInput: Story = {
  name: 'Simple Text Input',
  args: { exampleType: 'simple-input', showState: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByPlaceholderText('Enter some text...')
    await expect(input).toBeInTheDocument()
    await userEvent.type(input, 'Hello, Custom Field!')
    await expect(input).toHaveValue('Hello, Custom Field!')
  },
}

export const ColorPickerExample: Story = {
  name: 'Color Picker',
  args: { exampleType: 'color-picker', label: 'Choose a color', showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const colorInput = canvas.getByDisplayValue('#3b82f6')
    await expect(colorInput).toBeInTheDocument()
  },
}

export const StarRatingExample: Story = {
  name: 'Star Rating',
  args: { exampleType: 'rating', label: 'Rate this item', showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const stars = await canvas.findAllByText('★')
    await expect(stars).toHaveLength(5)
    // Click the 4th star
    await userEvent.click(stars[3])
    await expect(canvas.getByText('4 stars')).toBeInTheDocument()
  },
}

export const CounterExample: Story = {
  name: 'Counter',
  args: { exampleType: 'counter', label: 'Quantity', showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const incrementBtn = await canvas.findByText('+')
    const decrementBtn = await canvas.findByText('−')
    await expect(canvas.getByText('5')).toBeInTheDocument() // Default value
    
    await userEvent.click(incrementBtn)
    await expect(canvas.getByText('6')).toBeInTheDocument()
    
    await userEvent.click(decrementBtn)
    await userEvent.click(decrementBtn)
    await expect(canvas.getByText('4')).toBeInTheDocument()
  },
}

export const RichTextEditorExample: Story = {
  name: 'Rich Text Editor',
  args: { exampleType: 'rich-text', label: 'Content', showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = await canvas.findByPlaceholderText('Start typing your rich text...')
    const boldBtn = await canvas.findByText('B')
    
    await userEvent.click(boldBtn)
    await userEvent.type(textarea, 'This is bold text!')
    await expect(textarea).toHaveValue('This is bold text!')
  },
}

export const ReadOnly: Story = {
  name: 'Read-Only (Value Style)',
  args: { 
    exampleType: 'simple-input', 
    readOnly: true, 
    defaultValue: 'This is read-only text',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should show the value as text, not an input
    await expect(canvas.getByText('This is read-only text')).toBeInTheDocument()
    // Should not have an editable input
    await expect(canvas.queryByPlaceholderText('Enter some text...')).not.toBeInTheDocument()
  },
}

export const ReadOnlyDisabled: Story = {
  name: 'Read-Only (Disabled Style)',
  args: { 
    exampleType: 'simple-input', 
    readOnly: true, 
    readOnlyStyle: 'disabled',
    defaultValue: 'This is disabled read-only',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should show a disabled input
    const input = await canvas.findByDisplayValue('This is disabled read-only')
    await expect(input).toBeDisabled()
  },
}

export const WithError: Story = {
  name: 'Error State',
  args: { 
    exampleType: 'simple-input', 
    hasError: true, 
    errorMessage: 'This field is required.',
    showState: false 
  },
}

export const FormReadOnly: Story = {
  name: 'Form Read-Only',
  args: { 
    exampleType: 'rating', 
    formReadOnly: true, 
    readOnly: false, // Field level is false, form level is true
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should show the value as text since form is read-only
    await expect(canvas.getByText('3')).toBeInTheDocument()
    // Should not have interactive stars
    await expect(canvas.queryByText('★')).not.toBeInTheDocument()
  },
}

export const TagInputExample: Story = {
  name: 'Tag Input (Complex Example)',
  args: { 
    exampleType: 'simple-input', // We'll override this in the render
    label: 'Tags',
    showState: false 
  },
  render: (args) => {
    const field: { key: string; type: FormFieldType.Custom; options: CustomFieldOptions<string[]> } = {
      key: 'storybookTagField',
      type: FormFieldType.Custom,
      options: {
        label: 'Tags',
        customField: TagInput,
        defaultValue: ['react', 'typescript'],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should show default tags
    await expect(canvas.getByText('react')).toBeInTheDocument()
    await expect(canvas.getByText('typescript')).toBeInTheDocument()
    
    // Add a new tag
    const input = await canvas.findByPlaceholderText('Add a tag...')
    await userEvent.type(input, 'javascript')
    await userEvent.click(canvas.getByText('Add'))
    await expect(canvas.getByText('javascript')).toBeInTheDocument()
  },
} 