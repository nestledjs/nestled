import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, DatePickerOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateDatePickerCode = (args: DatePickerFieldStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'Select Date') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue) options.push(`defaultValue: '${args.defaultValue}'`)
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.min) options.push(`min: '${args.min}'`)
  if (args.max) options.push(`max: '${args.max}'`)
  if (args.placeholder) options.push(`placeholder: '${args.placeholder}'`)
  if (args.useController) options.push('useController: true')
  
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
      key: 'eventDate',
      type: FormFieldType.DatePicker,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

interface DatePickerFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: string
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  min: string
  max: string
  placeholder: string
  useController: boolean
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
  helpText: string
}

const meta: Meta<DatePickerFieldStoryArgs> = {
  title: 'Forms/DatePickerField',
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
          return generateDatePickerCode(storyContext.args)
        },
      },
      story: {
        inline: true,
        autoplay: false, // Disable auto-playing interactions in docs
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Date picker label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default date (YYYY-MM-DD)' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    min: { control: 'text', description: 'Minimum date (YYYY-MM-DD)' },
    max: { control: 'text', description: 'Maximum date (YYYY-MM-DD)' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    useController: { control: 'boolean', description: 'Use react-hook-form Controller?' },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
    helpText: { control: 'text', description: 'Help text' },
  },
  args: {
    label: 'Select Date',
    required: false,
    disabled: false,
    defaultValue: '',
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select a valid date.',
    min: '',
    max: '',
    placeholder: '',
    useController: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
    helpText: '',
  },
  render: (args) => {
    const field = {
      key: 'storybookDatePicker',
      type: FormFieldType.DatePicker,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue || undefined,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && { readOnlyStyle: args.readOnlyStyle }),
        min: args.min || undefined,
        max: args.max || undefined,
        placeholder: args.placeholder || undefined,
        useController: args.useController,
        ...(args.helpText && { helpText: args.helpText }),
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
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toBeInTheDocument()
    await expect(input).toHaveAttribute('type', 'date')
  },
}

export const WithDefaultValue: Story = {
  name: 'With Default Value',
  args: { defaultValue: '2024-12-25', label: 'Christmas Day', showState: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Christmas Day'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toHaveValue('2024-12-25')
  },
}

export const Required: Story = {
  name: 'Required',
  args: { required: true, showState: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toBeRequired()
  },
}

export const Disabled: Story = {
  name: 'Disabled',
  args: { disabled: true, defaultValue: '2024-01-01', showState: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('2024-01-01')
  },
}

export const WithMinMax: Story = {
  name: 'With Min/Max Dates',
  args: { 
    min: '2024-01-01', 
    max: '2024-12-31', 
    label: 'Select date in 2024',
    defaultValue: '2024-06-15',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select date in 2024'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toHaveAttribute('min', '2024-01-01')
    await expect(input).toHaveAttribute('max', '2024-12-31')
    await expect(input).toHaveValue('2024-06-15')
  },
}

export const Error: Story = {
  name: 'Error State',
  args: { hasError: true, errorMessage: 'Please select a valid date.', showState: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toBeInTheDocument()
    await expect(canvas.getByText(/please select a valid date/i)).toBeInTheDocument()
  },
}

export const WithController: Story = {
  name: 'Using Controller',
  args: { 
    useController: true, 
    defaultValue: '2024-03-15',
    label: 'Birthday (with Controller)',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Use a forgiving regex to match the label
    const input = await canvas.findByLabelText(/Birthday/)
    await expect(input).toHaveValue('2024-03-15')
    await userEvent.clear(input)
    await userEvent.type(input, '2024-07-04')
    await expect(input).toHaveValue('2024-07-04')
  },
}

export const ReadOnly: Story = {
  name: 'Read-Only (Value Style)',
  args: { 
    readOnly: true, 
    defaultValue: '2024-04-01',
    label: 'April Fools Day',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // In 'value' style, should show formatted text instead of input
    await expect(canvas.getByText('April 01, 2024')).toBeInTheDocument()
    // Should not have an editable input
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
  },
}

export const ReadOnlyDisabledStyle: Story = {
  name: 'Read-Only (Disabled Style)',
  args: { 
    readOnly: true, 
    readOnlyStyle: 'disabled',
    defaultValue: '2024-07-04',
    label: 'Independence Day',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Independence Day'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('2024-07-04')
  },
}

export const FormReadOnly: Story = {
  name: 'Form Read-Only',
  args: { 
    formReadOnly: true, 
    defaultValue: '2024-10-31',
    readOnly: false, // Field level is false, form level is true
    label: 'Halloween',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should show formatted text since form is read-only
    await expect(canvas.getByText('October 31, 2024')).toBeInTheDocument()
    // Should not have an editable input
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
  },
}

export const FormReadOnlyStyle: Story = {
  name: 'Form Read-Only (Disabled Style)',
  args: { 
    formReadOnly: true, 
    formReadOnlyStyle: 'disabled',
    defaultValue: '2024-11-28',
    readOnly: false,
    label: 'Thanksgiving',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Thanksgiving'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('2024-11-28')
  },
}

export const FieldOverridesForm: Story = {
  name: 'Field Read-Only Overrides Form',
  args: { 
    formReadOnly: true, 
    formReadOnlyStyle: 'disabled', 
    readOnly: true, 
    readOnlyStyle: 'value', 
    defaultValue: '2024-02-14',
    label: 'Valentine\'s Day',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Field-level 'value' style should override form-level 'disabled' style
    await expect(canvas.getByText('February 14, 2024')).toBeInTheDocument()
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
  },
}

export const Interactive: Story = {
  name: 'Interactive Example',
  args: { 
    label: 'Event Date',
    required: true,
    min: '2024-01-01',
    max: '2025-12-31',
    showState: true 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Event Date'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    // Test setting a date
    await userEvent.type(input, '2024-08-15')
    await expect(input).toHaveValue('2024-08-15')
    // Test clearing the date
    await userEvent.clear(input)
    await expect(input).toHaveValue('')
  },
}

export const WithHelpText: Story = {
  name: 'With Help Text',
  args: { label: 'Event Date', helpText: 'Pick the date of your event.', showState: false },
  render: (args) => {
    const field: import('../form-types').FormField = {
      key: 'storybookDatePicker',
      type: FormFieldType.DatePicker,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue || undefined,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && { readOnlyStyle: args.readOnlyStyle }),
        min: args.min || undefined,
        max: args.max || undefined,
        placeholder: args.placeholder || undefined,
        useController: args.useController,
        ...(args.helpText && { helpText: args.helpText }),
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
    await expect(canvas.getByText('Pick the date of your event.')).toBeInTheDocument()
  },
}

export const RequiredLabel: Story = {
  name: 'Required Label',
  args: { label: 'Event Date', required: true, showState: false },
  render: (args) => {
    const field: import('../form-types').FormField = {
      key: 'storybookDatePicker',
      type: FormFieldType.DatePicker,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue || undefined,
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && { readOnlyStyle: args.readOnlyStyle }),
        min: args.min || undefined,
        max: args.max || undefined,
        placeholder: args.placeholder || undefined,
        useController: args.useController,
        ...(args.helpText && { helpText: args.helpText }),
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
    // Use getAllByText and assert at least one match
    const matches = canvas.getAllByText((content, node) => {
      const hasText = (node: HTMLElement) =>
        node.textContent === 'Event Date *' ||
        node.textContent?.replace(/\s+/g, ' ').trim() === 'Event Date *';
      const nodeHasText = hasText(node as HTMLElement);
      const childrenDontHaveText = Array.from((node as HTMLElement)?.children || []).every(
        (child) => !hasText(child as HTMLElement)
      );
      return nodeHasText && childrenDontHaveText;
    })
    expect(matches.length).toBeGreaterThan(0)
  },
} 