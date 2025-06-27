import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';

// Define the shape of our custom field options
type CustomFieldOptions = {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  readOnlyStyle?: 'value' | 'disabled';
  defaultValue?: unknown;
  customField: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
  }) => React.ReactNode;
};

// Define the shape of our custom field
type CustomFieldType = {
  key: string;
  type: FormFieldType.Custom;
  options: CustomFieldOptions;
};

type CustomFieldWrapperProps = {
  field: CustomFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

// Example custom components that can be used with CustomField
const ColorPicker = ({ value = '#000000', onChange }: { value?: string; onChange: (color: string) => void }) => (
  <div className="flex items-center gap-2">
    <input 
      type="color" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-10 p-0 border rounded overflow-hidden"
    />
    <span className="text-sm text-gray-600">{value}</span>
  </div>
);

const Rating = ({ value, onChange, max = 5 }: { value?: number; onChange: (rating: number) => void; max?: number }) => {
  const currentValue = value ?? 0;
  
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className={`text-2xl ${i < currentValue ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// Create a wrapper component to demonstrate form integration
const CustomFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: CustomFieldWrapperProps) => {
  const form = useForm<Record<string, unknown>>({
    defaultValues: {
      [field.key]: field.options?.defaultValue,
    },
  });
  
  // Create a safe custom field render function
  const renderCustomField = () => {
    const value = form.watch(field.key);
    const handleChange = (newValue: unknown) => {
      form.setValue(field.key, newValue);
    };
    
    return field.options.customField({
      value,
      onChange: handleChange,
    });
  };
  
  return (
    <div className="max-w-md p-4 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
        </label>
        {renderCustomField()}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">Form value:</div>
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(form.watch(field.key), null, 2)}
        </pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof CustomFieldWrapper> = {
  component: CustomFieldWrapper,
  title: 'Forms/CustomField',
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
      key: 'customField',
      type: FormFieldType.Custom,
      options: {
        label: 'Custom Field',
        customField: ({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) => (
          <input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter custom value"
          />
        ),
      },
    },
    hasError: false,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
  },
};

export default meta;
type Story = StoryObj<typeof CustomFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const ColorPickerExample: Story = {
  args: {
    field: {
      key: 'colorPicker',
      type: FormFieldType.Custom,
      options: {
        label: 'Choose a color',
        defaultValue: '#3b82f6',
        customField: ({ value, onChange }) => {
          const colorValue = typeof value === 'string' ? value : '#3b82f6';
          const handleChange = (newColor: string) => {
            onChange(newColor);
          };
          return (
            <ColorPicker 
              value={colorValue} 
              onChange={handleChange} 
            />
          );
        },
      },
    },
  },
};

export const StarRating: Story = {
  args: {
    field: {
      key: 'rating',
      type: FormFieldType.Custom,
      options: {
        label: 'Rate this component',
        defaultValue: 0,
        customField: ({ value, onChange }) => {
          const ratingValue = typeof value === 'number' ? value : 0;
          return (
            <div className="space-y-2">
              <Rating 
                value={ratingValue} 
                onChange={onChange} 
                max={5} 
              />
              <div className="text-xs text-gray-500">
                {ratingValue ? `You rated this ${ratingValue} star${ratingValue !== 1 ? 's' : ''}` : 'Click to rate'}
              </div>
            </div>
          );
        },
      },
    },
  },
};

export const ReadOnlyCustomField: Story = {
  args: {
    formReadOnly: true,
    field: {
      key: 'readOnlyCustom',
      type: FormFieldType.Custom,
      options: {
        label: 'Read-only custom field',
        readOnly: true,
        defaultValue: 'This value cannot be edited',
        customField: ({ value }: { value: string }) => (
          <div className="p-2 bg-gray-100 rounded">
            {value || 'No value provided'}
          </div>
        ),
      },
    },
  },
};

export const WithErrorState: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorField',
      type: FormFieldType.Custom,
      options: {
        label: 'Field with error',
        customField: ({ value, onChange }) => (
          <div className="space-y-1">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-2 border border-red-500 rounded focus:ring-red-500 focus:border-red-500"
              placeholder="This field has an error"
            />
            <p className="text-sm text-red-600">This field is required</p>
          </div>
        ),
      },
    },
  },
};
