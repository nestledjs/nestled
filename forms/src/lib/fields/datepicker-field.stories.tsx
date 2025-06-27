import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { DatePickerField } from './datepicker-field';
import { format } from 'date-fns';

// Define the shape of our date field
type DateFieldType = {
  key: string;
  type: FormFieldType.DatePicker;
  options: {
    label?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    readOnlyStyle?: 'value' | 'disabled';
    defaultValue?: string;
    useController?: boolean;
  };
};

type DateFieldWrapperProps = {
  field: DateFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

// Wrapper component to demonstrate form integration
const DateFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: DateFieldWrapperProps) => {
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
        <div className="date-picker-wrapper">
          {/* @ts-ignore - We're providing all required methods through the spread */}
          <DatePickerField 
            form={{
              ...form,
              control: form.control,
              getValues: form.getValues,
              setValue: form.setValue,
              register: form.register,
            } as unknown as UseFormReturn<Record<string, unknown>>}
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
          {value ? format(new Date(value), 'yyyy-MM-dd') : 'No date selected'}
        </pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof DateFieldWrapper> = {
  component: DateFieldWrapper,
  title: 'Forms/DatePickerField',
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
      key: 'dateField',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Select a date',
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
type Story = StoryObj<typeof DateFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'dateWithDefault',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Appointment Date',
        defaultValue: '2025-06-27', // Today's date as default
        required: true,
      },
    },
  },
};

export const RequiredField: Story = {
  args: {
    field: {
      key: 'requiredDate',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Required Date',
        required: true,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledDate',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Disabled Date Picker',
        disabled: true,
        defaultValue: '2025-01-01',
      },
    },
  },
};

export const ReadOnlyAsValue: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    field: {
      key: 'readOnlyDate',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Read-only (as value)',
        readOnly: true,
        defaultValue: '2025-12-25',
      },
    },
  },
};

export const ReadOnlyAsDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    field: {
      key: 'readOnlyDisabledDate',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Read-only (as disabled)', 
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: '2025-06-15',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorDate',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Date with Error',
        required: true,
      },
    },
  },
};

export const UsingController: Story = {
  args: {
    field: {
      key: 'controlledDate',
      type: FormFieldType.DatePicker,
      options: {
        label: 'Using Controller',
        useController: true,
        defaultValue: '2025-03-15',
      },
    },
  },
};
