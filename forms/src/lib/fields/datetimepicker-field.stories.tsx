import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, DatePickerOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateDateTimePickerCode = (args: DateTimePickerFieldStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'Select Date & Time') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue) options.push(`defaultValue: '${args.defaultValue}'`)
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.min) options.push(`min: '${args.min}'`)
  if (args.max) options.push(`max: '${args.max}'`)
  if (args.step) options.push(`step: ${args.step}`)
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
      key: 'appointmentDateTime',
      type: FormFieldType.DateTimePicker,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

interface DateTimePickerFieldStoryArgs {
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
  step: number
  placeholder: string
  useController: boolean
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

const meta: Meta<DateTimePickerFieldStoryArgs> = {
  title: 'Forms/DateTimePickerField',
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
          return generateDateTimePickerCode(storyContext.args)
        },
      },
      story: {
        inline: true,
        autoplay: false, // Disable auto-playing interactions in docs
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Date-time picker label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'text', description: 'Default datetime (YYYY-MM-DDTHH:MM)' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    min: { control: 'text', description: 'Minimum datetime (YYYY-MM-DDTHH:MM)' },
    max: { control: 'text', description: 'Maximum datetime (YYYY-MM-DDTHH:MM)' },
    step: { control: 'number', description: 'Step in seconds' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    useController: { control: 'boolean', description: 'Use react-hook-form Controller?' },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
  args: {
    label: 'Select Date & Time',
    required: false,
    disabled: false,
    defaultValue: '',
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select a valid date and time.',
    min: '',
    max: '',
    step: 60, // 1 minute steps by default
    placeholder: '',
    useController: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field: { key: string; type: FormFieldType.DateTimePicker; options: DatePickerOptions } = {
      key: 'storybookDateTimePicker',
      type: FormFieldType.DateTimePicker,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue || undefined,
        // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && { readOnlyStyle: args.readOnlyStyle }),
        min: args.min || undefined,
        max: args.max || undefined,
        step: args.step || undefined,
        placeholder: args.placeholder || undefined,
        useController: args.useController,
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
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toBeInTheDocument()
    await expect(input).toHaveAttribute('type', 'datetime-local')
  },
}

export const WithDefaultValue: Story = {
  name: 'With Default Value',
  args: { 
    defaultValue: '2024-12-25T18:00', 
    label: 'Christmas Dinner',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toHaveValue('2024-12-25T18:00')
  },
}

export const Required: Story = {
  name: 'Required',
  args: { required: true, showState: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    await expect(input).toBeRequired()
  },
}

export const Disabled: Story = {
  name: 'Disabled',
  args: { 
    disabled: true, 
    defaultValue: '2024-01-01T12:00',
    label: 'New Year Lunch',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('2024-01-01T12:00')
  },
}

export const WithMinMax: Story = {
  name: 'With Min/Max DateTime',
  args: { 
    min: '2024-06-01T09:00', 
    max: '2024-06-30T17:00', 
    label: 'June Business Hours',
    defaultValue: '2024-06-15T14:00',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toHaveAttribute('min', '2024-06-01T09:00')
    await expect(input).toHaveAttribute('max', '2024-06-30T17:00')
    await expect(input).toHaveValue('2024-06-15T14:00')
  },
}

export const WithStep: Story = {
  name: 'With 15-Minute Steps',
  args: { 
    step: 900, // 15 minutes in seconds
    label: 'Appointment Time',
    defaultValue: '2024-07-01T10:15',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toHaveAttribute('step', '900')
    await expect(input).toHaveValue('2024-07-01T10:15')
  },
}

export const Error: Story = {
  name: 'Error State',
  args: { 
    hasError: true, 
    errorMessage: 'Please select a valid date and time.',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toBeInTheDocument()
    // Check for error message
    await expect(canvas.getByText(/please select a valid date and time/i)).toBeInTheDocument()
  },
}

export const WithController: Story = {
  name: 'Using Controller',
  args: { 
    useController: true, 
    defaultValue: '2024-03-15T16:30',
    label: 'Meeting Time (with Controller)',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toHaveValue('2024-03-15T16:30')
    
    // Test changing the value
    await userEvent.clear(input)
    await userEvent.type(input, '2024-07-04T12:00')
    await expect(input).toHaveValue('2024-07-04T12:00')
  },
}

export const ReadOnly: Story = {
  name: 'Read-Only (Value Style)',
  args: { 
    readOnly: true, 
    defaultValue: '2024-04-01T09:00',
    label: 'April Fools Morning',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // In 'value' style, should show formatted text instead of input
    const label = args.label || 'Select Date & Time'
    await expect(canvas.getByText('April 01, 2024 9:00 AM')).toBeInTheDocument()
    // Should not have an editable input
    await expect(canvas.queryByLabelText(label)).not.toBeInTheDocument()
  },
}

export const ReadOnlyDisabledStyle: Story = {
  name: 'Read-Only (Disabled Style)',
  args: { 
    readOnly: true, 
    readOnlyStyle: 'disabled',
    defaultValue: '2024-07-04T20:00',
    label: 'Independence Day Evening',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // In 'disabled' style, should show disabled input
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('2024-07-04T20:00')
  },
}

export const FormReadOnly: Story = {
  name: 'Form Read-Only',
  args: { 
    formReadOnly: true, 
    defaultValue: '2024-10-31T18:00',
    readOnly: false, // Field level is false, form level is true
    label: 'Halloween Party',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // Should show formatted text since form is read-only
    const label = args.label || 'Select Date & Time'
    await expect(canvas.getByText('October 31, 2024 6:00 PM')).toBeInTheDocument()
    // Should not have an editable input
    await expect(canvas.queryByLabelText(label)).not.toBeInTheDocument()
  },
}

export const FormReadOnlyStyle: Story = {
  name: 'Form Read-Only (Disabled Style)',
  args: { 
    formReadOnly: true, 
    formReadOnlyStyle: 'disabled',
    defaultValue: '2024-11-28T15:00',
    readOnly: false,
    label: 'Thanksgiving Dinner',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // In 'disabled' style, should show disabled input
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(label)
    await expect(input).toBeDisabled()
    await expect(input).toHaveValue('2024-11-28T15:00')
  },
}

export const FieldOverridesForm: Story = {
  name: 'Field Read-Only Overrides Form',
  args: { 
    formReadOnly: true, 
    formReadOnlyStyle: 'disabled', 
    readOnly: true, 
    readOnlyStyle: 'value', 
    defaultValue: '2024-02-14T19:30',
    label: 'Valentine\'s Dinner',
    showState: false 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // Field-level 'value' style should override form-level 'disabled' style
    const label = args.label || 'Select Date & Time'
    await expect(canvas.getByText('February 14, 2024 7:30 PM')).toBeInTheDocument()
    await expect(canvas.queryByLabelText(label)).not.toBeInTheDocument()
  },
}

export const Interactive: Story = {
  name: 'Interactive Example',
  args: { 
    label: 'Appointment DateTime',
    required: true,
    min: '2024-01-01T08:00',
    max: '2025-12-31T18:00',
    step: 900, // 15-minute intervals
    showState: true 
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const label = args.label || 'Select Date & Time'
    const input = await canvas.findByLabelText(new RegExp(`^${label}\\s*\\*?$`))
    
    // Test setting a datetime
    await userEvent.type(input, '2024-08-15T14:30')
    await expect(input).toHaveValue('2024-08-15T14:30')
    
    // Test clearing the datetime
    await userEvent.clear(input)
    await expect(input).toHaveValue('')
  },
} 