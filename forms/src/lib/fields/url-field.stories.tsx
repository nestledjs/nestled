import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { UrlField } from './url-field';
import { useState } from 'react';

// Wrapper component to demonstrate form integration
function UrlFieldWrapper({
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

  // Format URL for display
  const formatUrl = (url: string) => {
    if (!url) return '—';
    // Remove protocol for cleaner display
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  };

  return (
    <div className="max-w-2xl space-y-6 p-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              https://
            </span>
            <UrlField 
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
                  placeholder: field.options.placeholder || 'example.com',
                },
              }}
              hasError={hasError || !!error}
              formReadOnly={formReadOnly}
              formReadOnlyStyle={formReadOnlyStyle}
            />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error.message as string || 'Please enter a valid URL'}
          </p>
        )}
        {value && !error && (
          <div className="mt-1">
            <a 
              href={value.startsWith('http') ? value : `https://${value}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              <span className="truncate max-w-xs">{formatUrl(value)}</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
      
      {field.options.description && (
        <p className="mt-1 text-sm text-gray-500">{field.options.description}</p>
      )}
    </div>
  );
}

const meta: Meta<typeof UrlFieldWrapper> = {
  component: UrlFieldWrapper,
  title: 'Forms/UrlField',
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
type Story = StoryObj<typeof UrlFieldWrapper>;

export const Default: Story = {
  args: {
    field: {
      key: 'website',
      type: FormFieldType.Url,
      options: {
        label: 'Website URL',
        placeholder: 'your-website.com',
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'portfolio',
      type: FormFieldType.Url,
      options: {
        label: 'Portfolio URL',
        defaultValue: 'example.com/portfolio',
      },
    },
  },
};

export const Required: Story = {
  args: {
    field: {
      key: 'linkedin',
      type: FormFieldType.Url,
      options: {
        label: 'LinkedIn Profile',
        placeholder: 'linkedin.com/in/username',
        required: true,
        description: 'Please provide your LinkedIn profile URL',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    field: {
      key: 'github',
      type: FormFieldType.Url,
      options: {
        label: 'GitHub Profile',
        placeholder: 'github.com/username',
        required: true,
      },
    },
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'companySite',
      type: FormFieldType.Url,
      options: {
        label: 'Company Website',
        defaultValue: 'company.com',
        disabled: true,
      },
    },
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'documentation',
      type: FormFieldType.Url,
      options: {
        label: 'Documentation',
        defaultValue: 'docs.example.com',
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
      key: 'support',
      type: FormFieldType.Url,
      options: {
        label: 'Support Page',
        defaultValue: 'support.example.com',
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
        [args.field.key]: args.field.options?.defaultValue || '',
      },
      mode: 'onSubmit',
    });
    
    const [submittedData, setSubmittedData] = useState<string | null>(null);
    
    const onSubmit = (data: any) => {
      setSubmittedData(data[args.field.key]);
    };
    
    const value = form.watch(args.field.key);
    const error = form.formState.errors[args.field.key];
    
    // Format URL for display
    const formatUrl = (url: string) => {
      if (!url) return '—';
      // Remove protocol for cleaner display
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    };
    
    return (
      <div className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {args.field.options.label}
              {args.field.options.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  https://
                </span>
                <UrlField 
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
                      placeholder: args.field.options.placeholder || 'example.com',
                    },
                  }}
                  hasError={args.hasError || !!error}
                  formReadOnly={args.formReadOnly}
                  formReadOnlyStyle={args.formReadOnlyStyle}
                />
              </div>
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600">
                {error.message as string || 'Please enter a valid URL'}
              </p>
            )}
            {value && !error && (
              <div className="mt-1">
                <a 
                  href={value.startsWith('http') ? value : `https://${value}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  <span className="truncate max-w-xs">{formatUrl(value)}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              Save Profile
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
            <h3 className="text-sm font-medium text-green-800">Profile Updated</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Your profile URL has been saved:</p>
              <a 
                href={submittedData.startsWith('http') ? submittedData : `https://${submittedData}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center text-blue-600 hover:underline"
              >
                {formatUrl(submittedData)}
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {
    field: {
      key: 'personalWebsite',
      type: FormFieldType.Url,
      options: {
        label: 'Personal Website',
        placeholder: 'your-name.com',
        description: 'Share your personal website or blog URL',
        required: true,
      },
    },
  },
};
