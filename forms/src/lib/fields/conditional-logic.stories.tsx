import type { Meta, StoryObj } from '@storybook/react'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'

const meta: Meta<typeof Form> = {
  title: 'Form Features/Conditional Logic',
  component: Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Conditional Field Logic

Demonstrates dynamic field behavior based on form values:
- **showWhen**: Show/hide fields conditionally
- **requiredWhen**: Make fields required conditionally  
- **disabledWhen**: Enable/disable fields conditionally

All conditional functions receive the current form values and return a boolean.
        `,
      },
    },
  },
  argTypes: {
    submit: { action: 'submitted' },
  },
}

export default meta
type Story = StoryObj<typeof Form>

export const ShowWhenBasic: Story = {
  name: 'Show/Hide Fields',
  args: {
    id: 'conditional-show-when',
    fields: [
      FormFieldClass.select('contactMethod', {
        label: 'Preferred Contact Method',
        required: true,
        options: [
          { value: '', label: 'Select method...' },
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
          { value: 'mail', label: 'Physical Mail' },
        ],
      }),
      
      FormFieldClass.email('email', {
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email',
        showWhen: (values) => values.contactMethod === 'email',
      }),
      
      FormFieldClass.phone('phone', {
        label: 'Phone Number',
        required: true,
        showWhen: (values) => values.contactMethod === 'phone',
      }),
      
      FormFieldClass.text('address', {
        label: 'Mailing Address',
        required: true,
        placeholder: 'Enter your address',
        showWhen: (values) => values.contactMethod === 'mail',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fields appear and disappear based on the contact method selection. Required validation is automatically handled.',
      },
    },
  },
}

export const RequiredWhenConditional: Story = {
  name: 'Conditional Required Fields',
  args: {
    id: 'conditional-required-when',
    fields: [
      FormFieldClass.select('accountType', {
        label: 'Account Type',
        required: true,
        options: [
          { value: '', label: 'Select account type...' },
          { value: 'personal', label: 'Personal' },
          { value: 'business', label: 'Business' },
        ],
      }),
      
      FormFieldClass.text('firstName', {
        label: 'First Name',
        required: true,
        placeholder: 'Enter your first name',
      }),
      
      FormFieldClass.text('lastName', {
        label: 'Last Name',
        required: true,
        placeholder: 'Enter your last name',
      }),
      
      FormFieldClass.text('companyName', {
        label: 'Company Name',
        placeholder: 'Enter company name',
        requiredWhen: (values) => values.accountType === 'business',
      }),
      
      FormFieldClass.text('taxId', {
        label: 'Tax ID',
        placeholder: 'Enter tax identification number',
        requiredWhen: (values) => values.accountType === 'business',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
  parameters: {
    docs: {
      description: {
        story: 'Company Name and Tax ID become required when Business account type is selected. Notice the red asterisk appears dynamically.',
      },
    },
  },
}

export const DisabledWhenConditional: Story = {
  name: 'Conditional Disabled Fields',
  args: {
    id: 'conditional-disabled-when',
    fields: [
      FormFieldClass.checkbox('useCompanyEmail', {
        label: 'Use company email address',
      }),
      
      FormFieldClass.email('personalEmail', {
        label: 'Personal Email',
        placeholder: 'Enter your personal email',
        disabledWhen: (values) => values.useCompanyEmail === true,
      }),
      
      FormFieldClass.checkbox('sameAsBilling', {
        label: 'Shipping address same as billing',
      }),
      
      FormFieldClass.text('billingAddress', {
        label: 'Billing Address',
        required: true,
        placeholder: 'Enter billing address',
      }),
      
      FormFieldClass.text('shippingAddress', {
        label: 'Shipping Address',
        placeholder: 'Enter shipping address',
        disabledWhen: (values) => values.sameAsBilling === true,
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fields become disabled (grayed out) based on checkbox selections. Users cannot interact with disabled fields.',
      },
    },
  },
}

export const CombinedConditionalLogic: Story = {
  name: 'Combined Conditional Logic',
  args: {
    id: 'conditional-combined',
    fields: [
      FormFieldClass.select('userType', {
        label: 'User Type',
        required: true,
        options: [
          { value: '', label: 'Select user type...' },
          { value: 'student', label: 'Student' },
          { value: 'teacher', label: 'Teacher' },
          { value: 'admin', label: 'Administrator' },
        ],
      }),
      
      FormFieldClass.text('studentId', {
        label: 'Student ID',
        placeholder: 'Enter student ID',
        showWhen: (values) => values.userType === 'student',
        requiredWhen: (values) => values.userType === 'student',
      }),
      
      FormFieldClass.text('department', {
        label: 'Department',
        placeholder: 'Enter department',
        showWhen: (values) => ['teacher', 'admin'].includes(values.userType),
        requiredWhen: (values) => values.userType === 'teacher',
      }),
      
      FormFieldClass.checkbox('isHeadOfDepartment', {
        label: 'Head of Department',
        showWhen: (values) => values.userType === 'teacher',
      }),
      
      FormFieldClass.text('officeNumber', {
        label: 'Office Number',
        placeholder: 'Enter office number',
        showWhen: (values) => values.userType === 'teacher' && values.isHeadOfDepartment,
        requiredWhen: (values) => values.userType === 'teacher' && values.isHeadOfDepartment,
      }),
      
      FormFieldClass.searchSelectMulti('permissions', {
        label: 'Admin Permissions',
        options: [
          { value: 'users', label: 'Manage Users' },
          { value: 'courses', label: 'Manage Courses' },
          { value: 'reports', label: 'View Reports' },
          { value: 'system', label: 'System Settings' },
        ],
        showWhen: (values: any) => values.userType === 'admin',
        requiredWhen: (values: any) => values.userType === 'admin',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex form that demonstrates multiple conditional logic features working together. Shows nested dependencies and combinations of show/required/disabled logic.',
      },
    },
  },
}

export const MultiStepLikeConditional: Story = {
  name: 'Multi-Step Like Experience',
  args: {
    id: 'conditional-multistep',
    fields: [
      // Step 1: Basic Info
      FormFieldClass.text('fullName', {
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your full name',
      }),
      
      FormFieldClass.email('email', {
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email',
      }),
      
      // Step 2: Account Details (shows after basic info is filled)
      FormFieldClass.text('username', {
        label: 'Username',
        placeholder: 'Choose a username',
        showWhen: (values) => values.fullName && values.email,
        requiredWhen: (values) => values.fullName && values.email,
      }),
      
      FormFieldClass.password('password', {
        label: 'Password',
        placeholder: 'Enter a password',
        showWhen: (values) => values.fullName && values.email,
        requiredWhen: (values) => values.fullName && values.email,
      }),
      
      // Step 3: Preferences (shows after account details)
      FormFieldClass.select('theme', {
        label: 'Preferred Theme',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto' },
        ],
        showWhen: (values) => values.username && values.password,
      }),
      
      FormFieldClass.checkbox('newsletter', {
        label: 'Subscribe to newsletter',
        showWhen: (values) => values.username && values.password,
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
  parameters: {
    docs: {
      description: {
        story: 'Creates a multi-step-like experience where fields progressively appear as previous sections are completed.',
      },
    },
  },
}

export const ErrorHandling: Story = {
  name: 'Error Handling',
  args: {
    id: 'conditional-error-handling',
    fields: [
      FormFieldClass.text('triggerField', {
        label: 'Trigger Field',
        placeholder: 'Type "error" to trigger conditional logic error',
      }),
      
      FormFieldClass.text('problematicField', {
        label: 'Field with Problematic Logic',
        placeholder: 'This field has a buggy conditional function',
        // Intentionally problematic function that will throw an error
        showWhen: (values) => {
          if (values.triggerField === 'error') {
            throw new Error('Intentional error for testing')
          }
          return true
        },
      }),
      
      FormFieldClass.text('normalField', {
        label: 'Normal Field',
        placeholder: 'This field works normally',
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling in conditional logic. Type "error" in the trigger field to see how errors are handled gracefully (check browser console).',
      },
    },
  },
} 