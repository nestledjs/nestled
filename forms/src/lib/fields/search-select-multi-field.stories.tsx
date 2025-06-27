import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { SearchSelectMultiField } from './search-select-multi-field';
import { useState, useEffect } from 'react';
import { Button } from '../../button';

// Mock data for the multi-select
const mockUsers = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', role: 'Developer' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', role: 'Designer' },
  { id: '3', firstName: 'Michael', lastName: 'Johnson', email: 'michael.j@example.com', role: 'Manager' },
  { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w@example.com', role: 'Developer' },
  { id: '5', firstName: 'David', lastName: 'Brown', email: 'david.b@example.com', role: 'Designer' },
  { id: '6', firstName: 'Emily', lastName: 'Davis', email: 'emily.d@example.com', role: 'QA' },
  { id: '7', firstName: 'Robert', lastName: 'Miller', email: 'robert.m@example.com', role: 'DevOps' },
  { id: '8', firstName: 'Lisa', lastName: 'Wilson', email: 'lisa.w@example.com', role: 'PM' },
];

// Mock GraphQL query function
const mockQuery = (searchTerm = '') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = mockUsers.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
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
function SearchSelectMultiFieldWrapper({
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
      [field.key]: field.options?.defaultValue || [],
    },
    mode: 'onChange',
  });

  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const value = form.watch(field.key) || [];
  const error = form.formState.errors[field.key];

  // Update selected options when value changes
  useEffect(() => {
    if (value && value.length > 0) {
      const selected = mockUsers.filter(user => 
        value.includes(user.id)
      );
      setSelectedOptions(selected);
    } else {
      setSelectedOptions([]);
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
        <div className="search-select-multi-wrapper">
          <SearchSelectMultiField 
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
                    subLabel: item.role,
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
        <div className="font-medium mb-2">Selected Users ({selectedOptions.length}):</div>
        {selectedOptions.length > 0 ? (
          <div className="space-y-2">
            {selectedOptions.map((user) => (
              <div key={user.id} className="p-2 bg-white rounded border border-gray-200">
                <div className="font-semibold">{user.firstName} {user.lastName}</div>
                <div className="text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500 mt-1">Role: {user.role}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No users selected</div>
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof SearchSelectMultiFieldWrapper> = {
  component: SearchSelectMultiFieldWrapper,
  title: 'Forms/SearchSelectMultiField',
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
type Story = StoryObj<typeof SearchSelectMultiFieldWrapper>;

export const Default: Story = {
  args: {
    field: {
      key: 'assignedUsers',
      type: FormFieldType.SearchSelectMulti,
      options: {
        label: 'Assign team members',
        placeholder: 'Search by name, email, or role...',
        required: true,
      },
    },
  },
};

export const WithDefaultValues: Story = {
  args: {
    field: {
      key: 'assignedUsers',
      type: FormFieldType.SearchSelectMulti,
      options: {
        label: 'Team members',
        placeholder: 'Search team members...',
        defaultValue: ['2', '3'], // Jane Smith and Michael Johnson
      },
    },
  },
};

export const WithMaxSelections: Story = {
  args: {
    field: {
      key: 'reviewers',
      type: FormFieldType.SearchSelectMulti,
      options: {
        label: 'Select up to 3 reviewers',
        placeholder: 'Search team members...',
        maxSelections: 3,
      },
    },
  },
};

export const WithErrorState: Story = {
  args: {
    field: {
      key: 'requiredUsers',
      type: FormFieldType.SearchSelectMulti,
      options: {
        label: 'Required team members',
        placeholder: 'Select at least one team member...',
        required: true,
      },
    },
    hasError: true,
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'assignedUsers',
      type: FormFieldType.SearchSelectMulti,
      options: {
        label: 'Assigned Team',
        defaultValue: ['1', '4', '5'], // John, Sarah, David
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
      key: 'assignedUsers',
      type: FormFieldType.SearchSelectMulti,
      options: {
        label: 'Project Team',
        defaultValue: ['3', '6', '7'], // Michael, Emily, Robert
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
        [args.field.key]: args.field.options?.defaultValue || [],
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
            <div className="search-select-multi-wrapper">
              <SearchSelectMultiField 
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
                        subLabel: item.role,
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
            <Button 
              type="submit" 
              variant="primary"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              Save Team
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
            <h3 className="text-sm font-medium text-green-800">Team Saved Successfully</h3>
            <div className="mt-2 text-sm text-green-700 space-y-1">
              <p>Selected Team Members:</p>
              <ul className="list-disc pl-5">
                {submittedData[args.field.key]?.map((id: string) => {
                  const user = mockUsers.find(u => u.id === id);
                  return user ? (
                    <li key={user.id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </li>
                  ) : null;
                }) || <li>No team members selected</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {
    field: {
      key: 'teamMembers',
      type: FormFieldType.SearchSelectMulti,
      options: {
        label: 'Select team members',
        placeholder: 'Search by name, email, or role...',
        required: true,
      },
    },
  },
};
