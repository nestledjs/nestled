import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { FormFieldType } from '../form-types'
import { TextField } from './text-field'

// Mock form context for the story
const TextFieldWrapper = (args: any) => {
  const form = useForm({
    defaultValues: {
      [args.field.key]: args.field.options?.defaultValue || '',
    },
  })

  return (
    <div className="max-w-md p-4">
      <TextField
        form={form}
        field={args.field}
        hasError={args.hasError}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
      />
      {args.showFormState && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <pre>Form value: {JSON.stringify(form.watch(args.field.key), null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
const meta: Meta<typeof TextFieldWrapper> = {
  component: TextFieldWrapper,
  title: 'Forms/TextField',
  tags: ['autodocs'],
  argTypes: {
    hasError: { control: 'boolean' },
    formReadOnly: { control: 'boolean' },
    formReadOnlyStyle: {
      control: 'select',
      options: ['value', 'disabled'],
    },
    showFormState: { control: 'boolean' },
  },
  args: {
    field: {
      key: 'sampleField',
      type: FormFieldType.Input,
      label: 'Sample Text Field',
      options: {
        placeholder: 'Enter some text...',
        required: false,
        disabled: false,
        readOnly: false,
      },
    },
    hasError: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showFormState: true,
  },
}

export default meta
type Story = StoryObj<typeof TextFieldWrapper>

export const Default: Story = {
  args: {},
}

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'withDefault',
      type: FormFieldType.Input,
      label: 'With Default Value',
      options: {
        defaultValue: 'Pre-filled text',
      },
    },
  },
}

export const RequiredField: Story = {
  args: {
    field: {
      key: 'requiredField',
      type: FormFieldType.Input,
      label: 'Required Field',
      options: {
        required: true,
        placeholder: 'This field is required',
      },
    },
  },
}

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledField',
      type: FormFieldType.Input,
      label: 'Disabled Field',
      options: {
        disabled: true,
        defaultValue: 'Cannot edit this',
      },
    },
  },
}

export const ReadOnly: Story = {
  args: {
    field: {
      key: 'readOnlyField',
      type: FormFieldType.Input,
      label: 'Read Only Field',
      options: {
        readOnly: true,
        defaultValue: 'This is read-only text',
      },
    },
  },
}

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorField',
      type: FormFieldType.Input,
      label: 'Field with Error',
      options: {
        placeholder: 'This field has an error',
      },
    },
  },
}

export const CustomPlaceholder: Story = {
  args: {
    field: {
      key: 'customPlaceholder',
      type: FormFieldType.Input,
      label: 'Custom Placeholder',
      options: {
        placeholder: 'Type something amazing here...',
      },
    },
  },
}
