import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import { z } from 'zod'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'
import { useFormContext } from '../form-context'

// Component to watch form state changes
function FormStateWatcher({ onStateChange }: { onStateChange: (state: any) => void }) {
  const form = useFormContext()
  const values = form.watch()

  // Use useCallback to memoize the callback and avoid infinite loops
  const stableCallback = React.useCallback(onStateChange, [])

  React.useEffect(() => {
    stableCallback(values)
    // Only run when values actually change (by stringifying for comparison)
  }, [JSON.stringify(values), stableCallback])

  return null
}

// Define the args for Zod validation stories
interface ZodValidationStoryArgs {
  label: string
  placeholder: string
  required: boolean
  defaultValue: string
  minLength: number
  maxLength: number
  showState: boolean
  errorMessage: string
  hasError: boolean
}

/**
 * Zod Validation demonstrates how fields can use Zod schemas for validation.
 * This provides type-safe, composable validation with excellent error messages.
 */
const meta: Meta<ZodValidationStoryArgs> = {
  title: 'Forms/Validation/Zod Validation',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: "The field's visible label.",
      table: { category: 'Field Options' },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input.',
      table: { category: 'Field Options' },
    },
    required: {
      control: 'boolean',
      description: 'Is the field required?',
      table: { category: 'Field Options' },
    },
    defaultValue: {
      control: 'text',
      description: 'The initial value of the field.',
      table: { category: 'Field Options' },
    },
    minLength: {
      control: { type: 'number', min: 1, max: 50 },
      description: 'Minimum length for the Zod schema.',
      table: { category: 'Validation' },
    },
    maxLength: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Maximum length for the Zod schema.',
      table: { category: 'Validation' },
    },
    showState: {
      control: 'boolean',
      description: 'Show or hide the live form state debugger.',
      table: { category: 'Storybook' },
    },
    errorMessage: {
      control: 'text',
      description: 'Custom error message override.',
      table: { category: 'Validation' },
    },
    hasError: {
      control: 'boolean',
      description: 'Force an error state for testing.',
      table: { category: 'Storybook' },
    },
  },
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    required: true,
    defaultValue: '',
    minLength: 3,
    maxLength: 20,
    showState: true,
    errorMessage: '',
    hasError: false,
  },
  render: (args) => {
    const ZodDemo = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)
      const [formState, setFormState] = React.useState<any>({})

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Zod Validation Demo</h3>
        <Form
          id="zod-demo"
          fields={[
            FormFieldClass.text('zodValidationField', {
              label: args.label,
              placeholder: args.placeholder,
              required: args.required,
              defaultValue: args.defaultValue,
              schema: z.string()
                .min(args.minLength, `Must be at least ${args.minLength} characters`)
                .max(args.maxLength, `Must be no more than ${args.maxLength} characters`),
              errorMessages: args.errorMessage ? {
                too_small: args.errorMessage,
              } : undefined,
            }),

            FormFieldClass.button('submit', {
              text: 'Submit',
              type: 'submit',
            }),
          ]}
          submit={(values) => {
            console.log('✅ Form submitted:', values)
            setSubmitted(values)
          }}
          className="space-y-4"
        >
          <FormStateWatcher onStateChange={setFormState} />
        </Form>

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully!
            <pre className="text-xs mt-2">{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}

        {args.showState && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <h4 className="text-sm font-medium mb-2">Form State:</h4>
            <pre className="text-xs">{JSON.stringify(formState, null, 2)}</pre>
          </div>
        )}
      </div>
      )
    }

    return <ZodDemo />
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const BasicZodValidation: Story = {
  name: 'Basic Zod Schema',
  render: () => {
    const BasicZodTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)
      const [formState, setFormState] = React.useState<any>({})

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Basic Zod Validation</h3>
        <Form
          id="basic-zod-test"
          fields={[
            FormFieldClass.text('username', {
              label: 'Username',
              placeholder: 'Enter username',
              required: true,
              schema: z.string()
                .min(3, 'Must be at least 3 characters')
                .max(20, 'Must be no more than 20 characters'),
            }),

            FormFieldClass.button('submit', {
              text: 'Submit',
              type: 'submit',
            }),
          ]}
          submit={(values) => {
            console.log('✅ Form submitted:', values)
            setSubmitted(values)
          }}
          className="space-y-4"
        >
          <FormStateWatcher onStateChange={setFormState} />
        </Form>

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully!
            <pre className="text-xs mt-2">{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h4 className="text-sm font-medium mb-2">Form State:</h4>
          <pre className="text-xs">{JSON.stringify(formState, null, 2)}</pre>
        </div>
      </div>
      )
    }

    return <BasicZodTest />
  },
}

export const EmailValidation: Story = {
  name: 'Email Schema Validation',
  render: () => {
    const EmailTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)
      const [formState, setFormState] = React.useState<any>({})

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Email Validation</h3>
        <Form
          id="email-zod-test"
          fields={[
            FormFieldClass.email('email', {
              label: 'Email Address',
              placeholder: 'user@example.com',
              required: true,
              schema: z.string().email('Please enter a valid email address'),
            }),

            FormFieldClass.button('submit', {
              text: 'Submit',
              type: 'submit',
            }),
          ]}
          submit={(values) => {
            console.log('✅ Form submitted:', values)
            setSubmitted(values)
          }}
          className="space-y-4"
        >
          <FormStateWatcher onStateChange={setFormState} />
        </Form>

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully!
            <pre className="text-xs mt-2">{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h4 className="text-sm font-medium mb-2">Form State:</h4>
          <pre className="text-xs">{JSON.stringify(formState, null, 2)}</pre>
        </div>
      </div>
      )
    }

    return <EmailTest />
  },
}

export const CustomErrorMessages: Story = {
  name: 'Custom Error Messages',
  render: () => {
    const CustomErrorTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)
      const [formState, setFormState] = React.useState<any>({})

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Custom Error Messages</h3>
        <Form
          id="custom-error-test"
          fields={[
            FormFieldClass.password('password', {
              label: 'Password',
              placeholder: 'Enter secure password',
              required: true,
              schema: z.string().min(8),
              errorMessages: {
                too_small: 'Password is too weak! Use at least 8 characters.',
              },
            }),

            FormFieldClass.button('submit', {
              text: 'Submit',
              type: 'submit',
            }),
          ]}
          submit={(values) => {
            console.log('✅ Form submitted:', values)
            setSubmitted(values)
          }}
          className="space-y-4"
        >
          <FormStateWatcher onStateChange={setFormState} />
        </Form>

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully!
            <pre className="text-xs mt-2">{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h4 className="text-sm font-medium mb-2">Form State:</h4>
          <pre className="text-xs">{JSON.stringify(formState, null, 2)}</pre>
        </div>
      </div>
      )
    }

    return <CustomErrorTest />
  },
}

export const OptionalFieldValidation: Story = {
  name: 'Optional Field with Validation',
  render: () => {
    const OptionalFieldTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)
      const [formState, setFormState] = React.useState<any>({})

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Optional Field with Validation</h3>
        <Form
          id="optional-field-test"
          fields={[
            FormFieldClass.url('website', {
              label: 'Website (Optional)',
              placeholder: 'https://example.com',
              required: false,
              schema: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
            }),

            FormFieldClass.button('submit', {
              text: 'Submit',
              type: 'submit',
            }),
          ]}
          submit={(values) => {
            console.log('✅ Form submitted:', values)
            setSubmitted(values)
          }}
          className="space-y-4"
        >
          <FormStateWatcher onStateChange={setFormState} />
        </Form>

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully!
            <pre className="text-xs mt-2">{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h4 className="text-sm font-medium mb-2">Form State:</h4>
          <pre className="text-xs">{JSON.stringify(formState, null, 2)}</pre>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
          <p>This field is optional - you can submit without entering anything.</p>
          <p>If you do enter something, it must be a valid URL.</p>
        </div>
      </div>
      )
    }

    return <OptionalFieldTest />
  },
}