import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { SwitchField } from './switch-field';
import { useState } from 'react';

// Wrapper component to demonstrate form integration
function SwitchFieldWrapper({
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
      [field.key]: field.options?.defaultValue || false,
    },
    mode: 'onChange',
  });

  const value = form.watch(field.key);
  const error = form.formState.errors[field.key];

  return (
    <div className="max-w-md space-y-6 p-4">
      <div className="space-y-2">
        <div className="switch-field-wrapper">
          <SwitchField 
            form={{
              ...form,
              control: form.control,
              getValues: form.getValues,
              setValue: form.setValue,
              register: form.register,
              formState: form.formState,
            } as any}
            field={{
              ...field,
              options: {
                ...field.options,
                label: field.options.label || 'Toggle setting',
              },
            }}
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
        <div className="mt-2 text-sm text-gray-500">
          Current state: <span className="font-medium">{value ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof SwitchFieldWrapper> = {
  component: SwitchFieldWrapper,
  title: 'Forms/SwitchField',
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
type Story = StoryObj<typeof SwitchFieldWrapper>;

export const Default: Story = {
  args: {
    field: {
      key: 'notifications',
      type: FormFieldType.Switch,
      options: {
        label: 'Enable notifications',
        defaultValue: false,
      },
    },
  },
};

export const DefaultOn: Story = {
  args: {
    field: {
      key: 'darkMode',
      type: FormFieldType.Switch,
      options: {
        label: 'Dark mode',
        defaultValue: true,
      },
    },
  },
};

export const WithRequired: Story = {
  args: {
    field: {
      key: 'termsAccepted',
      type: FormFieldType.Switch,
      options: {
        label: 'I accept the terms and conditions',
        required: true,
      },
    },
  },
};

export const WithError: Story = {
  args: {
    field: {
      key: 'privacyPolicy',
      type: FormFieldType.Switch,
      options: {
        label: 'I agree to the privacy policy',
        required: true,
      },
    },
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'autoUpdate',
      type: FormFieldType.Switch,
      options: {
        label: 'Automatic updates',
        defaultValue: true,
        disabled: true,
      },
    },
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'twoFactorAuth',
      type: FormFieldType.Switch,
      options: {
        label: 'Two-factor authentication',
        defaultValue: true,
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
      key: 'emailAlerts',
      type: FormFieldType.Switch,
      options: {
        label: 'Email alerts',
        defaultValue: false,
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
        [args.field.key]: args.field.options?.defaultValue || false,
      },
      mode: 'onSubmit',
    });
    
    const [submittedData, setSubmittedData] = useState<boolean | null>(null);
    
    const onSubmit = (data: any) => {
      setSubmittedData(data[args.field.key]);
    };
    
    return (
      <div className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="switch-field-wrapper">
              <SwitchField 
                form={{
                  ...form,
                  control: form.control,
                  getValues: form.getValues,
                  setValue: form.setValue,
                  register: form.register,
                  formState: form.formState,
                } as any}
                field={{
                  ...args.field,
                  options: {
                    ...args.field.options,
                    label: args.field.options.label || 'Toggle setting',
                  },
                }}
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
            <div className="mt-2 text-sm text-gray-500">
              Current state: <span className="font-medium">{form.watch(args.field.key) ? 'ON' : 'OFF'}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={() => form.reset()}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Reset
            </button>
          </div>
        </form>
        
        {submittedData !== null && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-800">Settings Saved</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>New setting value: <span className="font-mono">{String(submittedData)}</span></p>
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {
    field: {
      key: 'emailNotifications',
      type: FormFieldType.Switch,
      options: {
        label: 'Enable email notifications',
        defaultValue: true,
        required: true,
      },
    },
  },
};
