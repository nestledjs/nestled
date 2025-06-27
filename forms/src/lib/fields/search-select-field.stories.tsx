import type { Meta, StoryObj } from '@storybook/react';
import { useForm, Controller } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { SearchSelectField } from './search-select-field';
import { useState, useEffect } from 'react';
import { Button } from '../../button';

// Mock data for the search select
const mockUsers = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com' },
  { id: '3', firstName: 'Michael', lastName: 'Johnson', email: 'michael.j@example.com' },
  { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w@example.com' },
  { id: '5', firstName: 'David', lastName: 'Brown', email: 'david.b@example.com' },
  { id: '6', firstName: 'Emily', lastName: 'Davis', email: 'emily.d@example.com' },
  { id: '7', firstName: 'Robert', lastName: 'Miller', email: 'robert.m@example.com' },
  { id: '8', firstName: 'Lisa', lastName: 'Wilson', email: 'lisa.w@example.com' },
];

// Mock GraphQL query function
const mockQuery = (searchTerm = '') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = mockUsers.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      resolve({ 
        data: { 
          users: filtered 
        } 
      });
    }, 300); // Simulate network delay
  });
};

// Wrapper component to demonstrate form integration
function SearchSelectFieldWrapper({
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
    },
    mode: 'onChange',
  });

  const [selectedOption, setSelectedOption] = useState<any>(null);
  const value = form.watch(field.key);
  const error = form.formState.errors[field.key];

  // Find the selected option when value changes
  useEffect(() => {
    if (value) {
      const option = mockUsers.find(user => user.id === value);
      setSelectedOption(option);
    } else {
      setSelectedOption(null);
    }
  }, [value]);

  // Mock the document prop with our mock query
  const mockDocument = {
    query: mockQuery,
  } as any;

  return (
    <div className="max-w-2xl p-4 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="search-select-wrapper">
          <SearchSelectField 
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
                document: mockDocument,
                dataType: 'users',
                selectOptionsFunction: (items: any[]) => 
                  items.map(item => ({
                    value: item.id,
                    label: `${item.firstName} ${item.lastName}`,
                    subLabel: item.email,
                  })),
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
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">Current selection:</div>
        {selectedOption ? (
          <div className="space-y-1">
            <div className="font-semibold">{selectedOption.firstName} {selectedOption.lastName}</div>
            <div className="text-gray-600">{selectedOption.email}</div>
            <div className="text-gray-500">ID: {selectedOption.id}</div>
          </div>
        ) : (
          <div className="text-gray-500">No selection</div>
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof SearchSelectFieldWrapper> = {
  component: SearchSelectFieldWrapper,
  title: 'Forms/SearchSelectField',
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
type Story = StoryObj<typeof SearchSelectFieldWrapper>;

export const Default: Story = {
  args: {
    field: {
      key: 'user',
      type: FormFieldType.SearchSelect,
      options: {
        label: 'Search for a user',
        placeholder: 'Type to search users...',
        required: true,
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'user',
      type: FormFieldType.SearchSelect,
      options: {
        label: 'Search for a user',
        placeholder: 'Type to search users...',
        defaultValue: '2', // Jane Smith
      },
    },
  },
};

export const WithErrorState: Story = {
  args: {
    field: {
      key: 'user',
      type: FormFieldType.SearchSelect,
      options: {
        label: 'Search for a user',
        placeholder: 'Type to search users...',
        required: true,
      },
    },
    hasError: true,
  },
};

export const WithCustomNoResults: Story = {
  args: {
    field: {
      key: 'user',
      type: FormFieldType.SearchSelect,
      options: {
        label: 'Search for a user',
        placeholder: 'Type to search users...',
        noOptionsMessage: () => 'No users found. Try a different search term.',
      },
    },
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'user',
      type: FormFieldType.SearchSelect,
      options: {
        label: 'Assigned User',
        defaultValue: '3', // Michael Johnson
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
      key: 'user',
      type: FormFieldType.SearchSelect,
      options: {
        label: 'Assigned User',
        defaultValue: '4', // Sarah Williams
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
        [args.field.key]: args.field.options?.defaultValue,
      },
      mode: 'onSubmit',
    });
    
    const [submittedData, setSubmittedData] = useState<any>(null);
    
    const onSubmit = (data: any) => {
      setSubmittedData(data);
    };
    
    // Mock the document prop with our mock query
    const mockDocument = {
      query: mockQuery,
    } as any;
    
    return (
      <div className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {args.field.options.label}
              {args.field.options.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="search-select-wrapper">
              <SearchSelectField 
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
                    document: mockDocument,
                    dataType: 'users',
                    selectOptionsFunction: (items: any[]) => 
                      items.map(item => ({
                        value: item.id,
                        label: `${item.firstName} ${item.lastName}`,
                        subLabel: item.email,
                      })),
                  },
                }}
                hasError={args.hasError}
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
            <Button type="submit" variant="primary">
              Submit
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
            <pre className="mt-2 text-xs text-green-700 overflow-auto max-h-40">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  },
  args: {
    field: {
      key: 'selectedUser',
      type: FormFieldType.SearchSelect,
      options: {
        label: 'Assign to user',
        placeholder: 'Search users...',
        required: true,
      },
    },
  },
};
