import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { DateTimePickerField } from './datetimepicker-field';
import { format } from 'date-fns';

// Define the shape of our datetime field
type DateTimeFieldType = {
  key: string;
  type: FormFieldType.DateTimePicker;
  options: {
    label?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    readOnlyStyle?: 'value' | 'disabled';
    defaultValue?: string;
  };
};

type DateTimeFieldWrapperProps = {
  field: DateTimeFieldType;
  hasError?: boolean;
  formReadOnly?: boolean;
  formReadOnlyStyle?: 'value' | 'disabled';
};

// Helper function to format date for display
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return 'No date/time selected';
  try {
    const date = new Date(dateTimeStr);
    return format(date, 'yyyy-MM-dd HH:mm');
  } catch (e) {
    return 'Invalid date/time';
  }
};

// Wrapper component to demonstrate form integration
const DateTimeFieldWrapper = ({
  field,
  hasError = false,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: DateTimeFieldWrapperProps) => {
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
        <div className="datetime-picker-wrapper">
          <DateTimePickerField 
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
        <div className="font-medium mb-1">Form value:</div>
        <pre className="whitespace-pre-wrap break-words">
          {value ? formatDateTime(value) : 'No date/time selected'}
        </pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof DateTimeFieldWrapper> = {
  component: DateTimeFieldWrapper,
  title: 'Forms/DateTimePickerField',
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
      key: 'dateTimeField',
      type: FormFieldType.DateTimePicker,
      options: {
        label: 'Select date and time',
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
type Story = StoryObj<typeof DateTimeFieldWrapper>;

export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'dateTimeWithDefault',
      type: FormFieldType.DateTimePicker,
      options: {
        label: 'Appointment Date & Time',
        defaultValue: new Date().toISOString().slice(0, 16), // Current date/time as default
        required: true,
      },
    },
  },
};

export const RequiredField: Story = {
  args: {
    field: {
      key: 'requiredDateTime',
      type: FormFieldType.DateTimePicker,
      options: {
        label: 'Required Date & Time',
        required: true,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'disabledDateTime',
      type: FormFieldType.DateTimePicker,
      options: {
        label: 'Disabled Date/Time Picker',
        disabled: true,
        defaultValue: '2025-01-01T12:00',
      },
    },
  },
};

export const ReadOnlyAsValue: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'value',
    field: {
      key: 'readOnlyDateTime',
      type: FormFieldType.DateTimePicker,
      options: {
        label: 'Read-only (as value)',
        readOnly: true,
        defaultValue: '2025-12-25T18:30',
      },
    },
  },
};

export const ReadOnlyAsDisabled: Story = {
  args: {
    formReadOnly: true,
    formReadOnlyStyle: 'disabled',
    field: {
      key: 'readOnlyDisabledDateTime',
      type: FormFieldType.DateTimePicker,
      options: {
        label: 'Read-only (as disabled)', 
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: '2025-06-15T09:15',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hasError: true,
    field: {
      key: 'errorDateTime',
      type: FormFieldType.DateTimePicker,
      options: {
        label: 'Date/Time with Error',
        required: true,
      },
    },
  },
};
