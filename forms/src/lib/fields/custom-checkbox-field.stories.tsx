import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { CustomCheckboxField } from './custom-checkbox-field';
import { tailwindTheme } from '../themes/tailwind';
import { unstyledTheme } from '../themes/unstyled';

const CustomCheckboxFieldWrapper = (args: any) => {
  const form = useForm({
    defaultValues: {
      [args.field.key]: args.field.options?.defaultValue || false,
    },
  });
  return (
    <div className="max-w-md p-4">
      <CustomCheckboxField
        form={form}
        field={args.field}
        hasError={args.hasError}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
        theme={args.theme}
      />
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
        <pre>Form value: {JSON.stringify(form.watch(args.field.key), null, 2)}</pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof CustomCheckboxFieldWrapper> = {
  component: CustomCheckboxFieldWrapper,
  title: 'Forms/CustomCheckboxField',
  tags: ['autodocs'],
  argTypes: {
    hasError: { control: 'boolean' },
    formReadOnly: { control: 'boolean' },
    formReadOnlyStyle: {
      control: 'select',
      options: ['value', 'disabled'],
    },
    theme: {
      control: 'select',
      options: ['tailwind', 'unstyled'],
      mapping: {
        tailwind: tailwindTheme,
        unstyled: unstyledTheme,
      },
      description: 'Select the theme for the CustomCheckboxField',
      table: {
        type: { summary: 'FormTheme' },
        defaultValue: { summary: 'tailwindTheme' },
      },
    },
  },
  args: {
    field: {
      key: 'customCheckbox',
      type: FormFieldType.CustomCheckbox,
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
    theme: tailwindTheme,
  },
};

export default meta;
type Story = StoryObj<typeof CustomCheckboxFieldWrapper>;

export const Default: Story = {};

export const CheckedByDefault: Story = {
  args: {
    field: {
      key: 'checkedByDefault',
      type: FormFieldType.CustomCheckbox,
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
      key: 'requiredCustomCheckbox',
      type: FormFieldType.CustomCheckbox,
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
      key: 'disabledCustomCheckbox',
      type: FormFieldType.CustomCheckbox,
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
      key: 'readOnlyCustomCheckbox',
      type: FormFieldType.CustomCheckbox,
      options: {
        label: 'Read-only custom checkbox',
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
      key: 'errorCustomCheckbox',
      type: FormFieldType.CustomCheckbox,
      options: {
        label: 'This field has an error',
        errorText: 'This is an error message.',
      },
    },
  },
};

export const FullWidthLabel: Story = {
  args: {
    field: {
      key: 'fullWidthLabelCustomCheckbox',
      type: FormFieldType.CustomCheckbox,
      options: {
        label: 'This custom checkbox has a full width label that wraps to multiple lines if needed. The text will flow naturally and the checkbox will stay aligned to the left.',
        fullWidthLabel: true,
      },
    },
  },
}; 