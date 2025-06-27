import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { MoneyField } from './money-field';
import { useState } from 'react';

// Define the shape of our money field
type MoneyFieldType = {
  key: string;
  type: FormFieldType.Currency;
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

type MoneyFieldWrapperProps = {
  field: MoneyFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

// Wrapper component to demonstrate form integration
const MoneyFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: MoneyFieldWrapperProps) => {
  const form = useForm({
    defaultValues: {
      [field.key]: field.options?.defaultValue || '',
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
        <div className="money-field-wrapper">
          <MoneyField 
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
        <div className="font-medium mb-1">Form value (raw):</div>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(value) || 'No value entered'}
        </pre>
        <div className="mt-2 font-medium mb-1">Formatted value:</div>
        <div className="font-mono">
          {value !== undefined && value !== '' ? 
            new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD' 
            }).format(Number(value)) : 
            'No value entered'}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof MoneyFieldWrapper> = {
  component: MoneyFieldWrapper,
  title: 'Forms/MoneyField',
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
      key: 'amount',
      type: FormFieldType.Currency,
      options: {
        label: 'Amount',
        placeholder: '0.00',
        required: false,
        disabled: false,
        step: '0.01',
      },
    },
    hasError: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
  },
};

export default meta;
type Story = StoryObj<typeof MoneyFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'price',
      type: FormFieldType.Currency,
      options: {
        label: 'Product Price',
        placeholder: '0.00',
        defaultValue: '29.99',
        required: true,
      },
    },
  },
};

export const WithMinMax: Story = {
  args: {
    field: {
      key: 'donation',
      type: FormFieldType.Currency,
      options: {
        label: 'Donation Amount',
        placeholder: '0.00',
        min: 5,
        max: 1000,
        defaultValue: '25.00',
        required: true,
      },
    },
  },
};

export const WithCustomStep: Story = {
  args: {
    field: {
      key: 'customStep',
      type: FormFieldType.Currency,
      options: {
        label: 'Custom Increment ($5)',
        placeholder: '0.00',
        step: '5',
        defaultValue: '25.00',
      },
    },
  },
};

export const RequiredField: Story = {
  args: {
    field: {
      key: 'requiredAmount',
      type: FormFieldType.Currency,
      options: {
        label: 'Required Amount',
        placeholder: '0.00',
        required: true,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledAmount',
      type: FormFieldType.Currency,
      options: {
        label: 'Disabled Field',
        defaultValue: '100.00',
        disabled: true,
      },
    },
  },
};

export const ReadOnlyAsValue: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    field: {
      key: 'readOnlyAmount',
      type: FormFieldType.Currency,
      options: {
        label: 'Read-only (as value)', 
        readOnly: true,
        defaultValue: '75.50',
      },
    },
  },
};

export const ReadOnlyAsDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    field: {
      key: 'readOnlyDisabledAmount',
      type: FormFieldType.Currency,
      options: {
        label: 'Read-only (as disabled)', 
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: '150.75',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorAmount',
      type: FormFieldType.Currency,
      options: {
        label: 'Amount with Error',
        required: true,
      },
    },
  },
};

export const WithValidation: Story = {
  args: {
    field: {
      key: 'validatedAmount',
      type: FormFieldType.Currency,
      options: {
        label: 'Amount with Validation',
        placeholder: 'Enter amount between $10 and $1000',
        required: true,
      },
    },
  },
  render: function Render(args) {
    const form = useForm({
      defaultValues: {
        [args.field.key]: args.field.options?.defaultValue || '',
      },
      mode: 'onChange',
    });
    
    const value = form.watch(args.field.key);
    const error = form.formState.errors[args.field.key];
    
    return (
      <div className="max-w-md p-4 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {args.field.options.label}
            {args.field.options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="money-field-wrapper">
            <MoneyField 
              form={{
                ...form,
                register: form.register,
                getValues: form.getValues,
                setValue: form.setValue,
                control: form.control,
              } as any}
              field={{
                ...args.field,
                options: {
                  ...args.field.options,
                  // Add custom validation
                  validate: (value: string) => {
                    if (!value) return 'Amount is required';
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) return 'Please enter a valid number';
                    if (numValue < 10) return 'Minimum amount is $10';
                    if (numValue > 1000) return 'Maximum amount is $1000';
                    return true;
                  },
                },
              }}
              hasError={!!error}
              formReadOnly={args.formReadOnly}
              formReadOnlyStyle={args.formReadOnlyStyle}
            />
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error.message as string}
            </p>
          )}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
          <div className="font-medium mb-1">Form value (raw):</div>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(value) || 'No value entered'}
          </pre>
          <div className="mt-2 font-medium mb-1">Formatted value:</div>
          <div className="font-mono">
            {value !== undefined && value !== '' ? 
              new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD' 
              }).format(Number(value)) : 
              'No value entered'}
          </div>
        </div>
      </div>
    );
  },
};
