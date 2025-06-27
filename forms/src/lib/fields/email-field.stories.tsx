import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { EmailField } from './email-field';

// Define the shape of our email field
type EmailFieldType = {
  key: string;
  type: FormFieldType.Email;
  options: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    readOnlyStyle?: 'value' | 'disabled';
    defaultValue?: string;
  };
};

type EmailFieldWrapperProps = {
  field: EmailFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

// Wrapper component to demonstrate form integration
const EmailFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: EmailFieldWrapperProps) => {
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
        <div className="email-field-wrapper">
          <EmailField 
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
          {value || 'No value entered'}
        </pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof EmailFieldWrapper> = {
  component: EmailFieldWrapper,
  title: 'Forms/EmailField',
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
      key: 'emailField',
      type: FormFieldType.Email,
      options: {
        label: 'Email Address',
        placeholder: 'you@example.com',
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
type Story = StoryObj<typeof EmailFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'emailWithDefault',
      type: FormFieldType.Email,
      options: {
        label: 'Contact Email',
        placeholder: 'you@example.com',
        defaultValue: 'user@example.com',
        required: true,
      },
    },
  },
};

export const RequiredField: Story = {
  args: {
    field: {
      key: 'requiredEmail',
      type: FormFieldType.Email,
      options: {
        label: 'Work Email',
        placeholder: 'name@company.com',
        required: true,
      },
    },
  },
};

export const WithCustomPlaceholder: Story = {
  args: {
    field: {
      key: 'emailWithPlaceholder',
      type: FormFieldType.Email,
      options: {
        label: 'Newsletter Signup',
        placeholder: 'Enter your best email address',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledEmail',
      type: FormFieldType.Email,
      options: {
        label: 'Account Email',
        defaultValue: 'user@example.com',
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
      key: 'readOnlyEmail',
      type: FormFieldType.Email,
      options: {
        label: 'Registered Email',
        readOnly: true,
        defaultValue: 'user@example.com',
      },
    },
  },
};

export const ReadOnlyAsDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    field: {
      key: 'readOnlyDisabledEmail',
      type: FormFieldType.Email,
      options: {
        label: 'Account Email', 
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: 'user@example.com',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorEmail',
      type: FormFieldType.Email,
      options: {
        label: 'Email with Error',
        required: true,
      },
    },
  },
};

export const WithValidation: Story = {
  args: {
    field: {
      key: 'validatedEmail',
      type: FormFieldType.Email,
      options: {
        label: 'Email with Validation',
        placeholder: 'Enter a valid email address',
        required: true,
      },
    },
  },
  render: (args) => {
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
          <div className="email-field-wrapper">
            <EmailField 
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
                    if (!value) return 'Email is required';
                    if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
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
          <div className="font-medium mb-1">Form value:</div>
          <pre className="whitespace-pre-wrap break-words">
            {value || 'No value entered'}
          </pre>
        </div>
      </div>
    );
  },
};
