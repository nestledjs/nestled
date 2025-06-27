import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { CheckboxField } from './checkbox-field';

// Mock form context for the story
const CheckboxFieldWrapper = (args: any) => {
  const form = useForm({
    defaultValues: {
      [args.field.key]: args.field.options?.defaultValue || false,
    },
  });
  
  return (
    <div className="max-w-md p-4">
      <CheckboxField 
        form={form}
        field={args.field}
        hasError={args.hasError}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
      />
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
        <pre>Form value: {JSON.stringify(form.watch(args.field.key), null, 2)}</pre>
      </div>
    </div>
  );
};

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
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const CheckedByDefault: Story = {
  args: {
    field: {
      key: 'checkedByDefault',
      type: FormFieldType.Checkbox,
      options: {
        label: 'Subscribe to newsletter',
        defaultValue: true,
      },
    },
  },
};

export const Required: Story = {
  args: {
    field: {
      key: 'requiredCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'I accept the terms and conditions',
        required: true,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'This option is disabled',
        disabled: true,
      },
    },
  },
};

export const ReadOnly: Story = {
  args: {
    field: {
      key: 'readOnlyCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'Read-only checkbox',
        readOnly: true,
        defaultValue: true,
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorCheckbox',
      type: FormFieldType.Checkbox,
      options: {
        label: 'This field has an error',
      },
    },
  },
};

export const FullWidthLabel: Story = {
  args: {
    field: {
      key: 'fullWidthLabel',
      type: FormFieldType.Checkbox,
      options: {
        label: 'This checkbox has a full width label that wraps to multiple lines if needed. The text will flow naturally and the checkbox will stay aligned to the left.',
        fullWidthLabel: true,
      },
    },
  },
};

export const CustomLabelSize: Story = {
  args: {
    field: {
      key: 'customLabelSize',
      type: FormFieldType.Checkbox,
      options: {
        label: 'Large label text',
        labelTextSize: 'ml-2 mt-0.5 block text-base',
      },
    },
  },
};
