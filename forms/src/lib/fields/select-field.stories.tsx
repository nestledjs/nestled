import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FormFieldType, FormField } from '../form-types';
import { SelectField } from './select-field';

// Simple button component for the form
const Button = ({ 
  type = 'button', 
  variant = 'primary', 
  onClick, 
  children, 
  disabled = false 
}: { 
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md text-sm font-medium ${
      variant === 'primary' 
        ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300' 
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:text-gray-400'
    }`}
  >
    {children}
  </button>
);

// Define the type for our field options
interface SelectFieldOptions {
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  readOnlyStyle?: 'value' | 'disabled';
  defaultValue?: string | null;
}

// Define the type for our field
interface SelectFieldConfig extends Omit<FormField, 'options' | 'type'> {
  type: FormFieldType.Select | FormFieldType.EnumSelect;
  options: SelectFieldOptions;
}

// Wrapper component to demonstrate form integration
function SelectFieldWrapper({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: {
  field: SelectFieldConfig;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
}) {
  const form = useForm({
    defaultValues: {
      [field.key]: field.options?.defaultValue || null,
    },
    mode: 'onChange',
  });

  const value = form.watch(field.key);
  const selectedOption = field.options.options?.find((opt) => opt.value === value);
  const error = form.formState.errors[field.key];

  return (
    <div className="max-w-md space-y-6 p-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="select-field-wrapper">
          <SelectField 
            form={{
              ...form,
              control: form.control,
              getValues: form.getValues,
              setValue: form.setValue,
              register: form.register,
              formState: form.formState,
            } as any}
            field={field}
            hasError={hasError || !!error}
            formReadOnly={formReadOnly}
            formReadOnlyStyle={formReadOnlyStyle}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error.message as string || 'This field is required'}
          </p>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">Current Selection:</div>
        <div className="font-mono bg-white p-2 rounded border border-gray-200">
          {JSON.stringify({
            value: value,
            label: selectedOption?.label || 'None selected'
          }, null, 2)}
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof SelectFieldWrapper> = {
  component: SelectFieldWrapper,
  title: 'Forms/SelectField',
  tags: ['autodocs'],
  argTypes: {
    hasError: {
      control: 'boolean',
      description: 'Whether the field has an error',
    },
    formReadOnly: {
      control: 'boolean',
      description: 'Whether the form is in read-only mode',
    },
    formReadOnlyStyle: {
      control: {
        type: 'select',
        options: ['value', 'disabled'],
      },
      description: 'How to display the field in read-only mode',
    },
  },
  args: {
    hasError: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
  },
};

export default meta;
type Story = StoryObj<typeof SelectFieldWrapper>;

// Common options for all stories
const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const categoryOptions = [
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'enhancement', label: 'Enhancement' },
  { value: 'documentation', label: 'Documentation' },
];

export const Default: Story = {
  args: {
    field: {
      key: 'status',
      type: FormFieldType.Select,
      options: {
        label: 'Status',
        placeholder: 'Select a status...',
        options: statusOptions,
        required: true,
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'status',
      type: FormFieldType.Select,
      options: {
        label: 'Status',
        placeholder: 'Select a status...',
        options: statusOptions,
        defaultValue: 'published',
      },
    },
  },
};

export const WithDisabledState: Story = {
  args: {
    field: {
      key: 'status',
      type: FormFieldType.Select,
      options: {
        label: 'Status',
        placeholder: 'Select a status...',
        options: statusOptions,
        disabled: true,
        defaultValue: 'draft',
      },
    },
  },
};

export const WithErrorState: Story = {
  args: {
    field: {
      key: 'status',
      type: FormFieldType.Select,
      options: {
        label: 'Status',
        placeholder: 'Select a status...',
        options: statusOptions,
        required: true,
      },
    },
    hasError: true,
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'status',
      type: FormFieldType.Select,
      options: {
        label: 'Status',
        options: statusOptions,
        defaultValue: 'published',
        readOnly: true,
        readOnlyStyle: 'value',
      },
    },
    formReadOnly: true,
  },
};

export const ReadOnlyDisabled: Story = {
  args: {
    field: {
      key: 'status',
      type: FormFieldType.Select,
      options: {
        label: 'Status',
        options: statusOptions,
        defaultValue: 'published',
        readOnly: true,
        readOnlyStyle: 'disabled',
      },
    },
    formReadOnly: true,
  },
};

export const WithFormSubmission: Story = {
  render: function Render(args) {
    const form = useForm({
      defaultValues: {
        [args.field.key]: args.field.options?.defaultValue || null,
      },
      mode: 'onSubmit',
    });
    
    const [submittedData, setSubmittedData] = useState<any>(null);
    
    const onSubmit = (data: any) => {
      setSubmittedData(data);
    };
    
    return (
      <div className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {args.field.options.label}
              {args.field.options.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="select-field-wrapper">
              <SelectField 
                form={{
                  ...form,
                  control: form.control,
                  getValues: form.getValues,
                  setValue: form.setValue,
                  register: form.register,
                  formState: form.formState,
                } as any}
                field={args.field}
                hasError={args.hasError || !!form.formState.errors[args.field.key]}
                formReadOnly={args.formReadOnly}
                formReadOnlyStyle={args.formReadOnlyStyle}
              />
            </div>
            {form.formState.errors[args.field.key] && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors[args.field.key]?.message as string || 'This field is required'}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              variant="primary"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              Save
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
          </div>
        </form>
        
        {submittedData && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-800">Form Submitted</h3>
            <div className="mt-2 text-sm text-green-700">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(submittedData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {
    field: {
      key: 'category',
      type: FormFieldType.Select,
      options: {
        label: 'Category',
        placeholder: 'Select a category...',
        options: categoryOptions,
        required: true,
      },
    },
  },
};
