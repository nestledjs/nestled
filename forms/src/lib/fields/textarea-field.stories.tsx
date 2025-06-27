import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { TextAreaField } from './textarea-field';
import { useState } from 'react';

// Wrapper component to demonstrate form integration
function TextAreaFieldWrapper({
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
      [field.key]: field.options?.defaultValue || '',
    },
    mode: 'onChange',
  });

  const value = form.watch(field.key);
  const error = form.formState.errors[field.key];
  const characterCount = value?.length || 0;
  const maxLength = field.options.maxLength || 1000;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="max-w-2xl space-y-6 p-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <TextAreaField 
            form={{
              ...form,
              control: form.control,
              getValues: form.getValues,
              setValue: form.setValue,
              register: form.register,
              formState: form.formState,
            } as any}
            field={field}
            hasError={hasError || !!error || isOverLimit}
            formReadOnly={formReadOnly}
            formReadOnlyStyle={formReadOnlyStyle}
          />
          {(field.options.showCharacterCount || field.options.maxLength) && (
            <div className={`mt-1 text-xs text-right ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {characterCount} / {maxLength} characters
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error.message as string || 'This field is required'}
          </p>
        )}
        {isOverLimit && !error && (
          <p className="mt-1 text-sm text-red-600">
            Maximum length exceeded by {characterCount - maxLength} characters
          </p>
        )}
      </div>
      
      {field.options.description && (
        <p className="mt-1 text-sm text-gray-500">{field.options.description}</p>
      )}
      
      {field.options.showValuePreview && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
          <div className="font-medium mb-1">Preview:</div>
          <div className="whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">
            {value || <span className="text-gray-400">Start typing to see a preview...</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof TextAreaFieldWrapper> = {
  component: TextAreaFieldWrapper,
  title: 'Forms/TextAreaField',
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
type Story = StoryObj<typeof TextAreaFieldWrapper>;

export const Default: Story = {
  args: {
    field: {
      key: 'description',
      type: FormFieldType.TextArea,
      options: {
        label: 'Description',
        placeholder: 'Enter a description...',
        rows: 4,
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'bio',
      type: FormFieldType.TextArea,
      options: {
        label: 'Biography',
        placeholder: 'Tell us about yourself...',
        defaultValue: 'John is a passionate developer with 5+ years of experience in web development.',
        rows: 4,
      },
    },
  },
};

export const WithCharacterLimit: Story = {
  args: {
    field: {
      key: 'tweet',
      type: FormFieldType.TextArea,
      options: {
        label: 'Compose Tweet',
        placeholder: 'What\'s happening?',
        maxLength: 280,
        showCharacterCount: true,
        rows: 3,
      },
    },
  },
};

export const WithErrorState: Story = {
  args: {
    field: {
      key: 'feedback',
      type: FormFieldType.TextArea,
      options: {
        label: 'Your Feedback',
        placeholder: 'Share your thoughts with us...',
        required: true,
        rows: 4,
      },
    },
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'notes',
      type: FormFieldType.TextArea,
      options: {
        label: 'Admin Notes',
        placeholder: 'Only editable by administrators',
        defaultValue: 'This user has been verified.',
        disabled: true,
        rows: 4,
      },
    },
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'terms',
      type: FormFieldType.TextArea,
      options: {
        label: 'Terms and Conditions',
        defaultValue: 'By using this service, you agree to our terms and conditions. Please read them carefully.',
        readOnly: true,
        readOnlyStyle: 'value',
        rows: 4,
      },
    },
    formReadOnly: true,
  },
};

export const ReadOnlyDisabled: Story = {
  args: {
    field: {
      key: 'instructions',
      type: FormFieldType.TextArea,
      options: {
        label: 'Special Instructions',
        defaultValue: 'Handle with care. Fragile items inside.',
        readOnly: true,
        readOnlyStyle: 'disabled',
        rows: 2,
      },
    },
    formReadOnly: true,
  },
};

export const WithFormSubmission: Story = {
  render: function Render(args) {
    const form = useForm({
      defaultValues: {
        [args.field.key]: args.field.options?.defaultValue || '',
      },
      mode: 'onSubmit',
    });
    
    const [submittedData, setSubmittedData] = useState<string | null>(null);
    
    const onSubmit = (data: any) => {
      setSubmittedData(data[args.field.key]);
    };
    
    const value = form.watch(args.field.key) || '';
    const characterCount = value.length;
    const maxLength = args.field.options.maxLength || 1000;
    const isOverLimit = characterCount > maxLength;
    
    return (
      <div className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {args.field.options.label}
              {args.field.options.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <TextAreaField 
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
                    showCharacterCount: true,
                  },
                }}
                hasError={args.hasError || !!form.formState.errors[args.field.key] || isOverLimit}
                formReadOnly={args.formReadOnly}
                formReadOnlyStyle={args.formReadOnlyStyle}
              />
            </div>
            {form.formState.errors[args.field.key] && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors[args.field.key]?.message as string || 'This field is required'}
              </p>
            )}
            {isOverLimit && !form.formState.errors[args.field.key] && (
              <p className="mt-1 text-sm text-red-600">
                Maximum length exceeded by {characterCount - maxLength} characters
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={!form.formState.isDirty || form.formState.isSubmitting || isOverLimit}
            >
              Submit Feedback
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
            <h3 className="text-sm font-medium text-green-800">Feedback Submitted</h3>
            <div className="mt-2 text-sm text-green-700">
              <p className="font-medium">Your feedback:</p>
              <div className="mt-1 p-2 bg-white rounded border border-green-100 whitespace-pre-wrap">
                {submittedData}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {
    field: {
      key: 'feedback',
      type: FormFieldType.TextArea,
      options: {
        label: 'Your Feedback',
        placeholder: 'Share your thoughts with us...',
        description: 'Please provide detailed feedback about your experience.',
        required: true,
        maxLength: 500,
        showCharacterCount: true,
        rows: 4,
      },
    },
  },
};
