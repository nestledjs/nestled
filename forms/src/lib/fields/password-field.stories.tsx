import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { PasswordField } from './password-field';

type PasswordFieldType = {
  key: string;
  type: FormFieldType.Password;
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

type PasswordFieldWrapperProps = {
  field: PasswordFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

const PasswordFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: PasswordFieldWrapperProps) => {
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
        <div className="password-field-wrapper">
          <PasswordField 
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
};

const meta: Meta<typeof PasswordFieldWrapper> = {
  component: PasswordFieldWrapper,
  title: 'Forms/PasswordField',
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
      key: 'passwordField',
      type: FormFieldType.Password,
      options: {
        label: 'Password',
        placeholder: 'Enter your password',
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
type Story = StoryObj<typeof PasswordFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'withDefaultValue',
      type: FormFieldType.Password,
      options: {
        label: 'Password with Default',
        placeholder: 'Enter your password',
        defaultValue: 's3cr3tP@ss',
      },
    },
  },
};

export const Required: Story = {
  args: {
    field: {
      key: 'requiredPassword',
      type: FormFieldType.Password,
      options: {
        label: 'Required Password',
        placeholder: 'This field is required',
        required: true,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledPassword',
      type: FormFieldType.Password,
      options: {
        label: 'Disabled Password',
        placeholder: 'This field is disabled',
        disabled: true,
        defaultValue: 'cantChangeMe',
      },
    },
  },
};

export const ReadOnlyAsValue: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    field: {
      key: 'readOnlyPassword',
      type: FormFieldType.Password,
      options: {
        label: 'Read-only Password (as value)',
        readOnly: true,
        defaultValue: 'hiddenPassword123',
      },
    },
  },
};

export const ReadOnlyAsDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    field: {
      key: 'readOnlyDisabledPassword',
      type: FormFieldType.Password,
      options: {
        label: 'Read-only Password (as disabled)',
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: 'anotherPassword',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorPassword',
      type: FormFieldType.Password,
      options: {
        label: 'Password with Error',
        placeholder: 'This field has an error',
        required: true,
      },
    },
  },
};

export const WithValidation: Story = {
  args: {
    field: {
      key: 'validatedPassword',
      type: FormFieldType.Password,
      options: {
        label: 'Password with Validation',
        placeholder: 'Enter a strong password',
        required: true,
      },
    },
  },
  render: function Render(args) {
    const form = useForm({
      defaultValues: {
        [args.field.key]: args.field.options?.defaultValue ?? '',
      },
      mode: 'onChange',
    });
    
    const value = form.watch(args.field.key);
    const error = form.formState.errors[args.field.key];
    
    // Create a new field with validation
    const fieldWithValidation = {
      ...args.field,
      options: {
        ...args.field.options,
        validate: (val: string) => {
          if (!val) return 'Password is required';
          if (val.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(val)) return 'Password must contain at least one uppercase letter';
          if (!/[0-9]/.test(val)) return 'Password must contain at least one number';
          return true;
        },
      },
    };
    
    return (
      <div className="max-w-md p-4 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldWithValidation.options.label}
            {fieldWithValidation.options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="password-field-wrapper">
            <PasswordField 
              form={{
                ...form,
                register: form.register,
                getValues: form.getValues,
                setValue: form.setValue,
                control: form.control,
              } as any}
              field={fieldWithValidation}
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
          {value && !error && (
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                Password strength: 
                <span className="font-medium text-green-600">Strong</span>
              </div>
              <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: '100%' }}
                />
              </div>
            </div>
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
};
