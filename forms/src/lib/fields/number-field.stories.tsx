import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { NumberField } from './number-field';

type NumberFieldType = {
  key: string;
  type: FormFieldType.Number;
  options: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    readOnlyStyle?: 'value' | 'disabled';
    defaultValue?: number | string;
    min?: number;
    max?: number;
    step?: number | string;
  };
};

type NumberFieldWrapperProps = {
  field: NumberFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

const NumberFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: NumberFieldWrapperProps) => {
  const form = useForm({
    defaultValues: {
      [field.key]: field.options?.defaultValue ?? '',
    },
  });
  
  const value = form.watch(field.key);
  
  return (
    <div className="max-w-md p-4 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="number-field-wrapper">
          <NumberField 
            form={{
              ...form,
              register: form.register,
              getValues: form.getValues,
              setValue: form.setValue,
              control: form.control,
            } as any}
            field={field}
            hasError={hasError}
            formReadOnly={formReadOnly}
            formReadOnlyStyle={formReadOnlyStyle}
          />
        </div>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">Form value:</div>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(value) || 'No value'}
        </pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof NumberFieldWrapper> = {
  component: NumberFieldWrapper,
  title: 'Forms/NumberField',
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
      key: 'numberField',
      type: FormFieldType.Number,
      options: {
        label: 'Number Input',
        placeholder: 'Enter a number',
        required: false,
        disabled: false,
      },
    },
    hasError: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
  },
};

export default meta;
type Story = StoryObj<typeof NumberFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'withDefaultValue',
      type: FormFieldType.Number,
      options: {
        label: 'With Default Value',
        defaultValue: 42,
        required: true,
      },
    },
  },
};

export const WithMinMax: Story = {
  args: {
    field: {
      key: 'withMinMax',
      type: FormFieldType.Number,
      options: {
        label: 'With Min/Max (1-100)',
        min: 1,
        max: 100,
        defaultValue: 50,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledField',
      type: FormFieldType.Number,
      options: {
        label: 'Disabled Field',
        defaultValue: 123,
        disabled: true,
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorField',
      type: FormFieldType.Number,
      options: {
        label: 'Field with Error',
        required: true,
      },
    },
  },
};
