import type { Meta, StoryObj } from '@storybook/react';
import { useForm, Controller } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { MultiSelectField } from './multiselect-field';
import { useState } from 'react';

// Define the shape of our multi-select field
type MultiSelectFieldType = {
  key: string;
  type: FormFieldType.MultiSelect;
  options: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    readOnlyStyle?: 'value' | 'disabled';
    defaultValue?: Array<{ label: string; value: string | number }>;
    options: Array<{ label: string; value: string | number }>;
  };
};

type MultiSelectFieldWrapperProps = {
  field: MultiSelectFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

// Sample options for the multi-select
const sampleOptions = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
  { label: 'Option 4', value: '4' },
  { label: 'Option 5', value: '5' },
  { label: 'Option 6', value: '6' },
  { label: 'Option 7', value: '7' },
  { label: 'Option 8', value: '8' },
];

// Wrapper component to demonstrate form integration
const MultiSelectFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: MultiSelectFieldWrapperProps) => {
  const form = useForm({
    defaultValues: {
      [field.key]: field.options?.defaultValue || [],
    },
  });
  
  const value = form.watch(field.key) || [];
  
  return (
    <div className="max-w-md p-4 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="multi-select-field-wrapper">
          <Controller
            name={field.key}
            control={form.control}
            render={({ field: { onChange, value: fieldValue } }) => (
              <MultiSelectField 
                form={{
                  ...form,
                  register: form.register,
                  getValues: (key) => fieldValue,
                  setValue: (key, val) => {
                    onChange(val);
                    return true;
                  },
                  control: form.control,
                } as any}
                field={field}
                hasError={hasError}
                formReadOnly={formReadOnly}
                formReadOnlyStyle={formReadOnlyStyle}
              />
            )}
          />
        </div>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">Selected values:</div>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(value, null, 2) || 'No values selected'}
        </pre>
        <div className="mt-2 font-medium mb-1">Selected labels:</div>
        <div className="font-mono">
          {value && value.length > 0 
            ? value.map((item: any) => item?.label).join(', ') 
            : 'No values selected'}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof MultiSelectFieldWrapper> = {
  component: MultiSelectFieldWrapper,
  title: 'Forms/MultiSelectField',
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
      key: 'multiSelectField',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'Select Options',
        placeholder: 'Select options...',
        required: false,
        disabled: false,
        options: sampleOptions,
      },
    },
    hasError: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
  },
};

export default meta;
type Story = StoryObj<typeof MultiSelectFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'withDefaultValue',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'With Default Value',
        placeholder: 'Select options...',
        required: true,
        options: sampleOptions,
        defaultValue: [sampleOptions[0], sampleOptions[2]],
      },
    },
  },
};

export const RequiredField: Story = {
  args: {
    field: {
      key: 'requiredField',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'Required Field',
        placeholder: 'Select at least one option...',
        required: true,
        options: sampleOptions,
      },
    },
  },
};

export const WithCustomPlaceholder: Story = {
  args: {
    field: {
      key: 'withCustomPlaceholder',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'Custom Placeholder',
        placeholder: 'Choose your favorite options...',
        options: sampleOptions,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledField',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'Disabled Field',
        options: sampleOptions,
        disabled: true,
        defaultValue: [sampleOptions[1]],
      },
    },
  },
};

export const ReadOnlyAsValue: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    field: {
      key: 'readOnlyAsValue',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'Read-only (as value)',
        readOnly: true,
        options: sampleOptions,
        defaultValue: [sampleOptions[1], sampleOptions[3]],
      },
    },
  },
};

export const ReadOnlyAsDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    field: {
      key: 'readOnlyAsDisabled',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'Read-only (as disabled)',
        readOnly: true,
        readOnlyStyle: 'disabled',
        options: sampleOptions,
        defaultValue: [sampleOptions[0], sampleOptions[2], sampleOptions[4]],
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'withError',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'Field with Error',
        options: sampleOptions,
        required: true,
      },
    },
  },
};

export const WithManyOptions: Story = {
  args: {
    field: {
      key: 'withManyOptions',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'With Many Options',
        placeholder: 'Search options...',
        options: Array.from({ length: 50 }, (_, i) => ({
          label: `Option ${i + 1}`,
          value: `${i + 1}`,
        })),
      },
    },
  },
};

export const WithValidation: Story = {
  args: {
    field: {
      key: 'withValidation',
      type: FormFieldType.MultiSelect,
      options: {
        label: 'With Validation (2-4 items)',
        placeholder: 'Select 2-4 options...',
        required: true,
        options: sampleOptions,
      },
    },
  },
  render: function Render(args) {
    const form = useForm({
      defaultValues: {
        [args.field.key]: args.field.options?.defaultValue || [],
      },
      mode: 'onChange',
    });
    
    const value = form.watch(args.field.key) || [];
    const error = form.formState.errors[args.field.key];
    
    return (
      <div className="max-w-md p-4 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {args.field.options.label}
            {args.field.options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="multi-select-field-wrapper">
            <Controller
              name={args.field.key}
              control={form.control}
              rules={{
                validate: (value) => {
                  if (!value || value.length === 0) return 'At least one option is required';
                  if (value.length < 2) return 'Please select at least 2 options';
                  if (value.length > 4) return 'Please select no more than 4 options';
                  return true;
                },
              }}
              render={({ field: { onChange, value: fieldValue } }) => (
                <MultiSelectField 
                  form={{
                    ...form,
                    register: form.register,
                    getValues: (key) => fieldValue,
                    setValue: (key, val) => {
                      onChange(val);
                      return true;
                    },
                    control: form.control,
                  } as any}
                  field={args.field}
                  hasError={!!error}
                  formReadOnly={args.formReadOnly}
                  formReadOnlyStyle={args.formReadOnlyStyle}
                />
              )}
            />
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error.message as string}
            </p>
          )}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
          <div className="font-medium mb-1">Selected values ({value?.length || 0}):</div>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(value, null, 2) || 'No values selected'}
          </pre>
          <div className="mt-2 font-medium mb-1">Selected labels:</div>
          <div className="font-mono">
            {value && value.length > 0 
              ? value.map((item: any) => item?.label).join(', ') 
              : 'No values selected'}
          </div>
        </div>
      </div>
    );
  },
};
