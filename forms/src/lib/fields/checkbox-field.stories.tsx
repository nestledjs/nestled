import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { FormFieldType } from '../form-types'
import { CheckboxField } from './checkbox-field'

// Mock form context for the story
const CheckboxFieldWrapper = (args: any) => {
  const form = useForm({
    defaultValues: {
      [args.field.key]: args.field.options?.defaultValue || false,
    },
  })

  return (
    <div className="max-w-md p-4">
      <CheckboxField
        form={form}
        field={args.field}
        hasError={args.hasError}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
        theme={args.theme}
      />
      {args.showFormState && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <pre>Form value: {JSON.stringify(form.watch(args.field.key), null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

const meta: Meta<typeof CheckboxFieldWrapper> = {
  component: CheckboxFieldWrapper,
  title: 'Forms/CheckboxField',
  tags: ['autodocs'],
  argTypes: {
    hasError: { control: 'boolean' },
    formReadOnly: { control: 'boolean' },
    formReadOnlyStyle: {
      control: 'select',
      options: ['value', 'disabled'],
    },
    errorText: { control: 'text', name: 'Error Text' },
    showFormState: { control: 'boolean' },
  },
  args: {
    field: {
      key: 'sampleCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'I agree to the terms and conditions',
        required: false,
        disabled: false,
        readOnly: false,
        fullWidthLabel: false,
      },
    },
    hasError: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showFormState: true,
  },
}

export default meta
type Story = StoryObj<typeof CheckboxFieldWrapper>

export const Default: Story = {
  argTypes: {
    hasError: { control: 'boolean' },
    errorText: { control: 'text', name: 'Error Text' },
  },
  args: {
    hasError: false,
    errorText: 'This field has an error',
  },
  render: (args) => {
    const field = {
      ...args.field,
      options: {
        ...args.field.options,
        errorText: args.errorText,
      },
    }
    return <CheckboxFieldWrapper {...args} field={field} />
  },
}

export const CheckedByDefault: Story = {
  argTypes: {
    hasError: { control: 'boolean' },
    errorText: { control: 'text', name: 'Error Text' },
  },
  args: {
    field: {
      key: 'checkedByDefault',
      type: FormFieldType.Checkbox,
      options: {
        label: 'Subscribe to newsletter',
        defaultValue: true,
      },
    },
    hasError: false,
    errorText: 'This field has an error',
  },
  render: (args) => {
    const field = {
      ...args.field,
      options: {
        ...args.field.options,
        errorText: args.errorText,
      },
    }
    return <CheckboxFieldWrapper {...args} field={field} />
  },
}

export const Required: Story = {
  argTypes: {
    hasError: { control: 'boolean' },
    errorText: { control: 'text', name: 'Error Text' },
  },
  args: {
    field: {
      key: 'requiredCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'I accept the terms and conditions',
        required: true,
      },
    },
    hasError: false,
    errorText: 'This field has an error',
  },
  render: (args) => {
    const field = {
      ...args.field,
      options: {
        ...args.field.options,
        errorText: args.errorText,
      },
    }
    return <CheckboxFieldWrapper {...args} field={field} />
  },
}

export const Disabled: Story = {
  argTypes: {
    hasError: { control: 'boolean' },
    errorText: { control: 'text', name: 'Error Text' },
  },
  args: {
    field: {
      key: 'disabledCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'This option is disabled',
        disabled: true,
      },
    },
    hasError: false,
    errorText: 'This field has an error',
  },
  render: (args) => {
    const field = {
      ...args.field,
      options: {
        ...args.field.options,
        errorText: args.errorText,
      },
    }
    return <CheckboxFieldWrapper {...args} field={field} />
  },
}

export const ReadOnly: Story = {
  argTypes: {
    hasError: { control: 'boolean' },
    errorText: { control: 'text', name: 'Error Text' },
  },
  render: (args) => {
    const fieldWithErrorText = (baseField: any) => ({
      ...baseField,
      options: {
        ...baseField.options,
        errorText: args.errorText,
      },
    })

    return (
      <div className="space-y-4">
        <CheckboxFieldWrapper
          {...args}
          field={fieldWithErrorText({
            ...args.field,
            key: 'readOnlyChecked',
            options: {
              ...args.field.options,
              label: 'Read-only checked',
              readOnly: true,
              defaultValue: true,
            },
          })}
        />
        <CheckboxFieldWrapper
          {...args}
          field={fieldWithErrorText({
            ...args.field,
            key: 'readOnlyUnchecked',
            options: {
              ...args.field.options,
              label: 'Read-only unchecked',
              readOnly: true,
              defaultValue: false,
            },
          })}
        />
      </div>
    )
  },
  args: {
    field: {
      key: 'readOnlyCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'Read-only checkbox',
        readOnly: true,
        defaultValue: false,
      },
    },
    hasError: false,
    errorText: 'This field has an error',
  },
}

export const WithError: Story = {
  argTypes: {
    hasError: { control: 'boolean' },
    errorText: { control: 'text', name: 'Error Text' },
  },
  args: {
    hasError: true,
    errorText: 'This is an error message.',
    field: {
      key: 'errorCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'This field has an error',
        errorText: 'This is an error message.',
      },
    },
  },
  render: (args) => {
    const field = {
      ...args.field,
      options: {
        ...args.field.options,
        errorText: args.errorText,
      },
    }
    return <CheckboxFieldWrapper {...args} field={field} />
  },
}

export const FullWidthLabel: Story = {
  argTypes: {
    hasError: { control: 'boolean' },
    errorText: { control: 'text', name: 'Error Text' },
  },
  args: {
    field: {
      key: 'fullWidthLabel',
      type: FormFieldType.Checkbox,
      options: {
        label:
          'This checkbox has a full width label that wraps to multiple lines if needed. The text will flow naturally and the checkbox will stay aligned to the left.',
        fullWidthLabel: true,
      },
    },
    hasError: false,
    errorText: 'This field has an error',
  },
  render: (args) => {
    const field = {
      ...args.field,
      options: {
        ...args.field.options,
        errorText: args.errorText,
      },
    }
    return <CheckboxFieldWrapper {...args} field={field} />
  },
}

/**
 * This story demonstrates the formReadOnly prop which makes all fields in a form read-only.
 * This is useful when you want to display a form in read-only mode without setting each field's
 * readOnly option individually.
 */
export const FormReadOnly: Story = {
  argTypes: {
    formReadOnly: { control: 'boolean' },
    formReadOnlyStyle: {
      control: 'select',
      options: ['value', 'disabled'],
    },
  },
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
  },
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-500 mb-2">
          <p>Toggle the "formReadOnly" control to see how it affects the checkboxes.</p>
          <p className="mt-1">
            When formReadOnly is true, all checkboxes become read-only regardless of their individual readOnly setting.
          </p>
        </div>

        <CheckboxFieldWrapper
          {...args}
          field={{
            key: 'formReadOnlyChecked',
            type: FormFieldType.Checkbox,
            options: {
              label: 'Checked checkbox (formReadOnly controls this)',
              defaultValue: true,
            },
          }}
        />

        <CheckboxFieldWrapper
          {...args}
          field={{
            key: 'formReadOnlyUnchecked',
            type: FormFieldType.Checkbox,
            options: {
              label: 'Unchecked checkbox (formReadOnly controls this)',
              defaultValue: false,
            },
          }}
        />
      </div>
    )
  },
}

/**
 * This story demonstrates the formReadOnlyStyle prop which controls how read-only fields are displayed.
 * - 'value': Shows the field value as text (true/false) or using theme icons if available
 * - 'disabled': Shows the field as a disabled input
 */
export const FormReadOnlyStyles: Story = {
  argTypes: {
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
    },
  },
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
  },
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-500 mb-2">
          <p>Switch between 'value' and 'disabled' to see different read-only styles:</p>
          <ul className="list-disc ml-5 mt-1">
            <li>'value': Shows the value as text or using theme icons</li>
            <li>'disabled': Shows as a disabled checkbox input</li>
          </ul>
          <p className="mt-1">The formReadOnlyStyle prop only has an effect when a field is in read-only mode.</p>
        </div>

        <div className="p-3 border border-gray-200 rounded mb-4">
          <h3 className="font-medium mb-2">Checked checkbox:</h3>
          <CheckboxFieldWrapper
            {...args}
            field={{
              key: 'formReadOnlyStyleChecked',
              type: FormFieldType.Checkbox,
              options: {
                label: 'Checked checkbox with different read-only styles',
                defaultValue: true,
              },
            }}
          />
        </div>

        <div className="p-3 border border-gray-200 rounded">
          <h3 className="font-medium mb-2">Unchecked checkbox:</h3>
          <CheckboxFieldWrapper
            {...args}
            field={{
              key: 'formReadOnlyStyleUnchecked',
              type: FormFieldType.Checkbox,
              options: {
                label: 'Unchecked checkbox with different read-only styles',
                defaultValue: false,
              },
            }}
          />
        </div>
      </div>
    )
  },
}
