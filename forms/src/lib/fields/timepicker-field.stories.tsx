import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormFieldType } from '../form-types';
import { TimePickerField } from './timepicker-field';
import { useState } from 'react';

// Wrapper component to demonstrate form integration
function TimePickerFieldWrapper({
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

  // Format time for display
  const formatTimeDisplay = (timeString: string) => {
    if (!timeString) return '—';
    
    // If time is in format HH:MM:SS, extract just HH:MM
    const [hours, minutes] = timeString.split(':');
    if (hours && minutes) {
      // Format as 12-hour time with AM/PM
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  return (
    <div className="max-w-md space-y-6 p-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.options.label}
          {field.options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <TimePickerField 
            form={{
              ...form,
              control: form.control,
              getValues: form.getValues,
              setValue: form.setValue,
              register: form.register,
              formState: form.formState,
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
        {value && !error && (
          <div className="mt-1 text-sm text-gray-500">
            Selected time: <span className="font-medium">{formatTimeDisplay(value)}</span>
          </div>
        )}
      </div>
      
      {field.options.description && (
        <p className="mt-1 text-sm text-gray-500">{field.options.description}</p>
      )}
    </div>
  );
}

const meta: Meta<typeof TimePickerFieldWrapper> = {
  component: TimePickerFieldWrapper,
  title: 'Forms/TimePickerField',
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
type Story = StoryObj<typeof TimePickerFieldWrapper>;

export const Default: Story = {
  args: {
    field: {
      key: 'meetingTime',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Meeting Time',
        placeholder: 'Select a time',
      },
    },
  },
};

export const WithDefaultValue: Story = {
  args: {
    field: {
      key: 'lunchTime',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Lunch Time',
        defaultValue: '12:30',
      },
    },
  },
};

export const Required: Story = {
  args: {
    field: {
      key: 'appointmentTime',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Appointment Time',
        required: true,
        description: 'Please select a time for your appointment',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    field: {
      key: 'deliveryTime',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Delivery Time',
        required: true,
      },
    },
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    field: {
      key: 'officeHoursEnd',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Office Hours End',
        defaultValue: '17:00',
        disabled: true,
      },
    },
  },
};

export const ReadOnlyValue: Story = {
  args: {
    field: {
      key: 'breakTime',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Scheduled Break',
        defaultValue: '15:00',
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
      key: 'checkInTime',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Check-in Time',
        defaultValue: '14:00',
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
    
    // Format time for display
    const formatTimeDisplay = (timeString: string) => {
      if (!timeString) return '—';
      
      // If time is in format HH:MM:SS, extract just HH:MM
      const [hours, minutes] = timeString.split(':');
      if (hours && minutes) {
        // Format as 12-hour time with AM/PM
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHour}:${minutes} ${ampm}`;
      }
      return timeString;
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
              <TimePickerField 
                form={{
                  ...form,
                  control: form.control,
                  getValues: form.getValues,
                  setValue: form.setValue,
                  register: form.register,
                  formState: form.formState,
                } as any}
                field={args.field}
                hasError={args.hasError || !!error}
                formReadOnly={args.formReadOnly}
                formReadOnlyStyle={args.formReadOnlyStyle}
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600">
                {error.message as string || 'This field is required'}
              </p>
            )}
            {value && !error && (
              <div className="mt-1 text-sm text-gray-500">
                Selected time: <span className="font-medium">{formatTimeDisplay(value)}</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              Schedule Appointment
            </button>
            <button
              type="button"
              onClick={() => form.reset()}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Clear
            </button>
          </div>
        </form>
        
        {submittedData !== null && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-800">Appointment Scheduled</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Your appointment is scheduled for <span className="font-medium">{formatTimeDisplay(submittedData)}</span></p>
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {
    field: {
      key: 'appointmentTime',
      type: FormFieldType.TimePicker,
      options: {
        label: 'Appointment Time',
        description: 'Select a time between 9:00 AM and 5:00 PM',
        required: true,
      },
    },
  },
};
