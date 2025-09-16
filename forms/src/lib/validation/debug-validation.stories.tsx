import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'
import { useForm } from 'react-hook-form'
import { useFormContext } from '../form-context'

// Component to watch form state changes
function FormStateWatcher({ onStateChange }: { onStateChange: (state: any) => void }) {
  const form = useFormContext()
  const values = form.watch()

  React.useEffect(() => {
    onStateChange(values)
  }, [values, onStateChange])

  return null
}

const meta: Meta = {
  title: 'Forms/Validation/Debug Validation',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const DirectReactHookForm: Story = {
  name: 'Direct React Hook Form',
  render: () => {
    const DirectTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)

      const form = useForm({
        mode: 'onBlur',
        defaultValues: {
          password: '',
          confirmPassword: ''
        }
      })

      const onSubmit = (data: any) => {
        console.log('Form submitted:', data)
        setSubmitted(data)
      }

      return (
        <div className="p-4 max-w-md">
          <h2 className="text-lg font-bold mb-4">Direct React Hook Form Test</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <input
                id="password"
                type="password"
                className="w-full px-3 py-2 border rounded"
                {...form.register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              {form.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-3 py-2 border rounded"
                {...form.register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value, formValues) => {
                    console.log('DIRECT validate called:', { value, formValues })
                    return value === formValues.password || 'Passwords must match'
                  }
                })}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Submit
            </button>
          </form>

          {submitted && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
              ✅ Form submitted successfully!
              <pre className="text-xs mt-2">{JSON.stringify(submitted, null, 2)}</pre>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-100 rounded">
            <h3 className="text-sm font-medium mb-2">Form State:</h3>
            <pre className="text-xs">{JSON.stringify(form.watch(), null, 2)}</pre>
          </div>
        </div>
      )
    }

    return <DirectTest />
  }
}

export const OurFormLibrary: Story = {
  name: 'Our Form Library',
  render: () => {
    const OurFormTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)
      const [formState, setFormState] = React.useState<any>({})

      return (
      <div className="p-4 max-w-md">
        <h2 className="text-lg font-bold mb-4">Our Form Library Test</h2>
        <Form
          id="our-form-test"
          fields={[
            FormFieldClass.password('password', {
              label: 'Password',
              placeholder: 'Enter password',
              required: true,
            }),

            FormFieldClass.password('confirmPassword', {
              label: 'Confirm Password',
              placeholder: 'Re-enter password',
              required: true,
              validateWithForm: (value: string, formValues: any) => {
                console.log('OUR validateWithForm called:', { value, formValues })
                if (value !== formValues?.password) {
                  return 'Passwords must match'
                }
                return true
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
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <h3 className="text-sm font-medium mb-2">Submitted Values:</h3>
            <pre className="text-xs">{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="text-sm font-medium mb-2">Form State:</h3>
          <pre className="text-xs">{JSON.stringify(formState, null, 2)}</pre>
        </div>
      </div>
      )
    }

    return <OurFormTest />
  }
}