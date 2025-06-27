import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { RadioField } from './radio-field';
import { useEffect, useState } from 'react';

// Wrapper component to demonstrate form integration
function RadioFieldWrapper({
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
      [field.key]: field.options?.defaultValue,
      ...(field.options?.radioOptions?.reduce((acc: any, option: any) => {
        if (option.checkedSubOption?.key && field.options?.defaultSubValue) {
          acc[option.checkedSubOption.key] = field.options?.defaultSubValue;
        }
        return acc;
      }, {}) || {}),
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

  const selectedOption = field.options.radioOptions?.find((o: any) => o.value === currentValue);
  const selectedSubOptionKey = selectedOption?.checkedSubOption?.key;
  const subOptionValue = selectedSubOptionKey ? form.getValues(selectedSubOptionKey) : '';

  return (
    <div className="max-w-2xl p-4 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="radio-field-wrapper">
          <RadioField 
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
            {error.message as string || 'This field is required'}
          </p>
        )}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">Current selection:</div>
        <div className="font-mono break-all">
          {selectedOption ? selectedOption.label : 'No selection'}
        </div>
        {selectedSubOptionKey && subOptionValue && (
          <>
            <div className="font-medium mt-2 mb-1">Sub-option value:</div>
            <div className="font-mono break-all">{subOptionValue}</div>
          </>
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof RadioFieldWrapper> = {
  component: RadioFieldWrapper,
  title: 'Forms/RadioField',
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
type Story = StoryObj<typeof RadioFieldWrapper>;

const genderOptions = [
  { key: 'male', value: 'male', label: 'Male' },
  { key: 'female', value: 'female', label: 'Female' },
  { key: 'other', value: 'other', label: 'Other' },
  { key: 'prefer-not-to-say', value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const notificationOptions = [
  { 
    key: 'email', 
    value: 'email', 
    label: 'Email',
    checkedSubOption: {
      key: 'emailAddress',
      label: 'Email Address'
    }
  },
  { 
    key: 'sms', 
    value: 'sms', 
    label: 'SMS',
    checkedSubOption: {
      key: 'phoneNumber',
      label: 'Phone Number'
    }
  },
  { 
    key: 'none', 
    value: 'none', 
    label: 'No notifications'
  },
];

export const Default: Story = {
  args: {
    field: {
      key: 'gender',
      type: FormFieldType.Radio,
      options: {
        label: 'Gender',
        radioOptions: genderOptions,
        radioDirection: 'row',
      },
    },
  },
};

export const VerticalLayout: Story = {
  args: {
    field: {
      key: 'gender',
      type: FormFieldType.Radio,
      options: {
        label: 'Gender',
        radioOptions: genderOptions,
        radioDirection: 'column',
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'gender',
      type: FormFieldType.Radio,
      options: {
        label: 'Gender',
        radioOptions: genderOptions,
        radioDirection: 'row',
        defaultValue: 'female',
      },
    },
  },
};

export const RequiredField: Story = {
  args: {
    field: {
      key: 'gender',
      type: FormFieldType.Radio,
      options: {
        label: 'Gender',
        radioOptions: genderOptions,
        radioDirection: 'row',
        required: true,
      },
    },
  },
};

export const WithErrorState: Story = {
  args: {
    field: {
      key: 'gender',
      type: FormFieldType.Radio,
      options: {
        label: 'Gender',
        radioOptions: genderOptions,
        radioDirection: 'row',
        required: true,
      },
    },
    hasError: true,
  },
};

export const WithSubOptions: Story = {
  args: {
    field: {
      key: 'notificationPreference',
      type: FormFieldType.Radio,
      options: {
        label: 'How would you like to be notified?',
        radioOptions: notificationOptions,
        radioDirection: 'column',
        defaultValue: 'email',
        defaultSubValue: 'user@example.com',
      },
    },
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'gender',
      type: FormFieldType.Radio,
      options: {
        label: 'Gender',
        radioOptions: genderOptions,
        radioDirection: 'row',
        defaultValue: 'other',
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
      key: 'gender',
      type: FormFieldType.Radio,
      options: {
        label: 'Gender',
        radioOptions: genderOptions,
        radioDirection: 'row',
        defaultValue: 'female',
        readOnly: true,
        readOnlyStyle: 'disabled',
      },
    },
    formReadOnly: true,
  },
};

export const WithValidation: Story = {
  render: function Render(args) {
    const form = useForm({
      defaultValues: {
        [args.field.key]: args.field.options?.defaultValue,
      },
      mode: 'onChange',
    });
    
    const value = form.watch(args.field.key);
    const error = form.formState.errors[args.field.key];
    
    return (
      <div className="max-w-2xl p-4 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {args.field.options.label}
            {args.field.options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="radio-field-wrapper">
            <RadioField 
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
                  validate: (value: any) => {
                    if (!value) return 'Please select an option';
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
          <div className="font-medium mb-1">Current selection:</div>
          <div className="font-mono break-all">
            {value || 'No selection'}
          </div>
        </div>
      </div>
    );
  },
  args: {
    field: {
      key: 'terms',
      type: FormFieldType.Radio,
      options: {
        label: 'Do you accept the terms and conditions?',
        radioOptions: [
          { key: 'accept', value: 'accept', label: 'Yes, I accept' },
          { key: 'decline', value: 'decline', label: 'No, I decline' },
        ],
        radioDirection: 'column',
        required: true,
      },
    },
  },
};
