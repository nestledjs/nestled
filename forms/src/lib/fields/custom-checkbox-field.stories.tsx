import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, CustomCheckboxOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateCustomCheckboxCode = (args: CustomCheckboxFieldStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'I agree to the terms and conditions') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue) options.push('defaultValue: true')
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.helpText) options.push(`helpText: '${args.helpText}'`)
  if (args.fullWidthLabel) options.push('fullWidthLabel: true')
  if (args.hasCustomIcons) {
    options.push(`checkedIcon: <CustomCheckIcon />`)
    options.push(`uncheckedIcon: <CustomUncheckIcon />`)
  }
  
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
      key: 'customAgreement',
      type: FormFieldType.CustomCheckbox,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

interface CustomCheckboxFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: boolean
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  helpText: string
  fullWidthLabel: boolean
  hasCustomIcons: boolean
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

// Custom icons for demonstration
const CustomCheckIcon = (
  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const CustomUncheckIcon = (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const meta: Meta<CustomCheckboxFieldStoryArgs> = {
  title: 'Forms/CustomCheckboxField',
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
          return generateCustomCheckboxCode(storyContext.args)
        },
      },
      story: {
        inline: true,
        autoplay: false, // Disable auto-playing interactions in docs
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Checkbox label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'boolean', description: 'Checked by default?' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    helpText: { control: 'text', description: 'Help text' },
    fullWidthLabel: { control: 'boolean', description: 'Label takes full width?' },
    hasCustomIcons: { control: 'boolean', description: 'Use custom icons?' },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
  args: {
    label: 'I agree to the terms and conditions',
    required: false,
    disabled: false,
    defaultValue: false,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'This field is required.',
    helpText: '',
    fullWidthLabel: false,
    hasCustomIcons: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field: { key: string; type: FormFieldType.CustomCheckbox; options: CustomCheckboxOptions } = {
      key: 'storybookCustomCheckbox',
      type: FormFieldType.CustomCheckbox,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        helpText: args.helpText,
        fullWidthLabel: args.fullWidthLabel,
        // Add custom icons if requested
        ...(args.hasCustomIcons && {
          checkedIcon: CustomCheckIcon,
          uncheckedIcon: CustomUncheckIcon,
        }),
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
    const checkbox = await canvas.findByRole('checkbox')
    await expect(checkbox).toBeInTheDocument()
    await expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    await expect(checkbox).toBeChecked()
  },
}

export const Checked: Story = {
  name: 'Checked by Default',
  args: { defaultValue: true, showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = await canvas.findByRole('checkbox')
    await expect(checkbox).toBeChecked()
    await userEvent.click(checkbox)
    await expect(checkbox).not.toBeChecked()
  },
}

export const Required: Story = {
  name: 'Required',
  args: { required: true, showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = await canvas.findByRole('checkbox')
    await expect(checkbox).toBeRequired()
  },
}

export const Disabled: Story = {
  name: 'Disabled',
  args: { disabled: true, showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = await canvas.findByRole('checkbox')
    await expect(checkbox).toBeDisabled()
    await userEvent.click(checkbox)
    await expect(checkbox).not.toBeChecked()
  },
}

export const Error: Story = {
  name: 'Error State',
  args: { hasError: true, errorMessage: 'You must accept the terms.', showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = await canvas.findByRole('checkbox')
    await expect(checkbox).toBeInTheDocument()
    // Optionally check for error message
    await expect(canvas.getByText(/you must accept the terms/i)).toBeInTheDocument()
  },
}

export const WithCustomIcons: Story = {
  name: 'Custom Icons',
  args: { hasCustomIcons: true, showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = await canvas.findByRole('checkbox')
    await expect(checkbox).toBeInTheDocument()
    await expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    await expect(checkbox).toBeChecked()
  },
}

export const ReadOnly: Story = {
  name: 'Read-Only',
  args: { readOnly: true, defaultValue: true, showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // In 'value' style (default), should show text instead of checkbox
    await expect(canvas.getByText('Yes')).toBeInTheDocument()
    // Should not have an interactive checkbox
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
  },
}

export const ReadOnlyDisabledStyle: Story = {
  name: 'Read-Only Style: Disabled',
  args: { readOnly: true, readOnlyStyle: 'disabled', defaultValue: true, showState: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // In 'disabled' style, should show the checked icon and no interactive checkbox
    await expect(canvas.getByTestId('custom-checkbox-icon')).toBeInTheDocument()
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
  },
}

export const FullWidthLabel: Story = {
  name: 'Full Width Label',
  args: { fullWidthLabel: true, label: 'This is a long label that should wrap to multiple lines and take full width.', showState: false },
}

export const WithHelpText: Story = {
  name: 'With Help Text',
  args: { helpText: 'This explains what the custom checkbox does.', showState: false },
}

export const FormReadOnly: Story = {
  name: 'Form Read-Only',
  args: { formReadOnly: true, defaultValue: true, showState: false, readOnly: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // In 'value' style (default), should show text instead of checkbox
    await expect(canvas.getByText('Yes')).toBeInTheDocument()
    // Should not have an interactive checkbox
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
  },
}

export const FormReadOnlyStyle: Story = {
  name: 'Form Read-Only Style: Disabled',
  args: { formReadOnly: true, formReadOnlyStyle: 'disabled', defaultValue: false, showState: false, readOnly: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // In 'disabled' style, should show the unchecked icon and no interactive checkbox
    await expect(canvas.getByTestId('custom-checkbox-icon')).toBeInTheDocument()
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
  },
}

export const CustomIconsWithReadOnly: Story = {
  name: 'Custom Icons + Read-Only',
  args: { 
    hasCustomIcons: true, 
    readOnly: true, 
    readOnlyStyle: 'disabled', 
    defaultValue: true, 
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should show the custom icon in disabled state and no interactive checkbox
    await expect(canvas.getByTestId('custom-checkbox-icon')).toBeInTheDocument()
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
  },
}

export const FieldOverridesForm: Story = {
  name: 'Field Read-Only Overrides Form',
  args: { 
    formReadOnly: true, 
    formReadOnlyStyle: 'disabled', 
    readOnly: true, 
    readOnlyStyle: 'value', 
    defaultValue: true, 
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should find the label text twice (label and row)
    const matches = canvas.getAllByText('I agree to the terms and conditions')
    expect(matches.length).toBeGreaterThanOrEqual(2)
    // Should not have an interactive checkbox
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
  },
}

 