import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { PhoneField } from './phone-field';
import { useEffect, useState } from 'react';

// Wrapper component to demonstrate form integration
function PhoneFieldWrapper({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: {
  field: any;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
}) {
  const form = useForm({
    defaultValues: {
      [field.key]: field.options?.defaultValue ?? '',
    },
    mode: 'onChange',
  });

  const [currentValue, setCurrentValue] = useState(form.getValues(field.key));
  const error = form.formState.errors[field.key];

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === field.key) {
        setCurrentValue(value[name as keyof typeof value]);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, field.key]);

  return (
    <div className="max-w-md p-4 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="phone-field-wrapper">
          <PhoneField 
            form={{
              ...form,
              register: form.register,
              getValues: form.getValues,
              setValue: form.setValue,
              control: form.control,
            } as any}
            field={field}
            hasError={hasError || !!error}
            formReadOnly={formReadOnly}
            formReadOnlyStyle={formReadOnlyStyle}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error.message as string || 'Please enter a valid phone number'}
          </p>
        )}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">Current value:</div>
        <div className="font-mono break-all">
          {currentValue || 'No value entered'}
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof PhoneFieldWrapper> = {
  component: PhoneFieldWrapper,
  title: 'Forms/PhoneField',
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
type Story = StoryObj<typeof PhoneFieldWrapper>;

export const Default: Story = {
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number',
        placeholder: '(555) 123-4567',
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number',
        placeholder: '(555) 123-4567',
        defaultValue: '+14155552671',
      },
    },
  },
};

export const Required: Story = {
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number',
        placeholder: '(555) 123-4567',
        required: true,
      },
    },
  },
};

export const WithError: Story = {
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number',
        placeholder: '(555) 123-4567',
        required: true,
      },
    },
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number',
        placeholder: '(555) 123-4567',
        disabled: true,
        defaultValue: '+14155552671',
      },
    },
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number',
        readOnly: true,
        readOnlyStyle: 'value',
        defaultValue: '+14155552671',
      },
    },
    formReadOnly: true,
  },
};

export const ReadOnlyDisabled: Story = {
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number',
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: '+14155552671',
      },
    },
    formReadOnly: true,
  },
};

export const WithValidation: Story = {
  render: function Render(args) {
    const form = useForm({
      defaultValues: {
        [args.field.key]: args.field.options?.defaultValue ?? '',
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
          <div className="phone-field-wrapper">
            <PhoneField 
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
                  // Custom validation message
                  validate: (value: string) => {
                    if (!value) return 'Phone number is required';
                    if (value.length < 10) return 'Please enter a valid phone number';
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
          <div className="font-medium mb-1">Current value:</div>
          <div className="font-mono break-all">
            {value || 'No value entered'}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {value && `Length: ${value.length} characters`}
          </div>
        </div>
      </div>
    );
  },
  args: {
    field: {
      key: 'phone',
      type: FormFieldType.Phone,
      options: {
        label: 'Phone Number with Validation',
        placeholder: '(555) 123-4567',
        required: true,
      },
    },
  },
};
