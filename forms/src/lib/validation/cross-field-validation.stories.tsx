import type { Meta, StoryObj } from '@storybook/react-vite'
import { z } from 'zod'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import React from 'react'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'
import { useFormContext } from '../form-context'

// Component to watch form state changes
function FormStateWatcher({ onStateChange }: { onStateChange: (state: any) => void }) {
  const form = useFormContext()
  const values = form.watch()
  const valuesRef = React.useRef(values)

  React.useEffect(() => {
    // Only call onStateChange if values actually changed (deep comparison of keys)
    const hasChanged = JSON.stringify(valuesRef.current) !== JSON.stringify(values)
    if (hasChanged) {
      valuesRef.current = values
      onStateChange(values)
    }
  }, [values])

  return null
}

interface CrossFieldValidationStoryArgs {
  showState: boolean
}

/**
 * Cross-Field Validation demonstrates how fields can validate against other field values.
 * This includes password confirmation, conditional validation, and async validation.
 */
const meta: Meta<CrossFieldValidationStoryArgs> = {
  title: 'Forms/Validation/Cross-Field Validation',
  tags: ['autodocs'],
  argTypes: {
    showState: {
      control: 'boolean',
      description: 'Show or hide the live form state debugger.',
      table: { category: 'Storybook' },
    },
  },
  args: {
    showState: true,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const PasswordConfirmation: Story = {
  name: 'Password Confirmation',
  args: {
    showState: true,
  },
  render: (args) => {
    const PasswordConfirmationTest = () => {
      const [formState, setFormState] = React.useState<any>({})
      const [submitted, setSubmitted] = React.useState(false)

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <Form
          id="password-confirmation-test"
          fields={[
            FormFieldClass.password('password', {
              label: 'Password',
              placeholder: 'Enter password',
              required: true,
              schema: z.string().min(8, 'Password must be at least 8 characters'),
            }),

            FormFieldClass.password('confirmPassword', {
              label: 'Confirm Password',
              placeholder: 'Re-enter password',
              required: true,
              validateWithForm: (value: string, formValues: any) => {
                console.log('VALIDATE WITH FORM CALLED for confirmPassword:', {
                  confirmValue: value,
                  formValues: formValues,
                  passwordValue: formValues?.password,
                  typeOfFormValues: typeof formValues,
                  match: value === formValues?.password
                })
                if (!value) return true // Let required handle empty values
                if (!formValues || value !== formValues.password) {
                  return 'Passwords must match'
                }
                return true
              },
              validationDependencies: ['password'], // Re-validate when password changes
            }),

            FormFieldClass.button('submit', {
              text: 'Submit',
              type: 'submit',
            }),
          ]}
          submit={(values) => {
            console.log('✅ Form validation passed! Values:', values)
            setSubmitted(true)
            setFormState(values)
          }}
          className="space-y-4"
        >
          {/* We need to add a component that watches form state */}
          <FormStateWatcher onStateChange={setFormState} />
        </Form>

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully!
          </div>
        )}

        {args.showState && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
            <h4 className="font-bold mb-2">Live Form State:</h4>
            <p className="text-xs text-gray-600 mb-2">Note: Passwords shown for testing purposes</p>
            <pre>{JSON.stringify(formState, null, 2)}</pre>
          </div>
        )}
      </div>
      )
    }

    return <PasswordConfirmationTest />
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const passwordInput = canvas.getByLabelText(/^Password/)
    const confirmInput = canvas.getByLabelText(/Confirm Password/)

    await step('Enter password', async () => {
      await userEvent.type(passwordInput, 'mysecretpass')
      await userEvent.tab()
    })

    await step('Enter non-matching confirmation', async () => {
      await userEvent.type(confirmInput, 'differentpass')
      await userEvent.tab()

      await waitFor(() => {
        expect(canvas.getByText(/Passwords must match/)).toBeInTheDocument()
      })
    })

    await step('Fix confirmation to match', async () => {
      await userEvent.clear(confirmInput)
      await userEvent.type(confirmInput, 'mysecretpass')
      await userEvent.tab()

      await waitFor(() => {
        expect(canvas.queryByText(/Passwords must match/)).not.toBeInTheDocument()
      })
    })

    await step('Submit form with valid data', async () => {
      const submitButton = canvas.getByRole('button', { name: /Submit/i })
      await userEvent.click(submitButton)

      // If validation passes, the submit function will be called
      // We can't easily test the alert, but the click should work without errors
    })
  },
}

export const ConditionalValidation: Story = {
  name: 'Conditional Validation',
  args: {
    showState: true,
  },
  render: (args) => {
    const ConditionalValidationTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <Form
          id="conditional-validation-test"
          fields={[
            FormFieldClass.select('accountType', {
              label: 'Account Type',
              options: [
                { value: '', label: 'Select account type...' },
                { value: 'personal', label: 'Personal' },
                { value: 'business', label: 'Business' },
              ],
              required: true,
            }),

            FormFieldClass.text('companyName', {
              label: 'Company Name',
              placeholder: 'Enter company name',
              showWhen: (formValues: any) => formValues.accountType === 'business',
              requiredWhen: (formValues: any) => formValues.accountType === 'business',
              validateWhen: (formValues: any) => formValues.accountType === 'business',
              schema: z.string().min(2, 'Company name must be at least 2 characters'),
            }),

            FormFieldClass.email('businessEmail', {
              label: 'Business Email',
              placeholder: 'business@company.com',
              showWhen: (formValues: any) => formValues.accountType === 'business',
              requiredWhen: (formValues: any) => formValues.accountType === 'business',
              validateWithForm: (value: string, formValues: any) => {
                if (formValues.accountType === 'business' && !value.includes('@')) {
                  return 'Please enter a valid business email'
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
            console.log('✅ Conditional validation form submitted:', values)
            setSubmitted(values)
          }}
          className="space-y-4"
        />

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully with values:
            <pre className="text-xs mt-2">{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}

        {args.showState && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
            <h4 className="font-bold mb-2">Form demonstrates:</h4>
            <ul className="text-xs space-y-1">
              <li>• Company fields only show when "Business" is selected</li>
              <li>• Company fields only validate when shown</li>
              <li>• Business email has cross-field validation</li>
            </ul>
          </div>
        )}
      </div>
      )
    }

    return <ConditionalValidationTest />
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const accountSelect = canvas.getByLabelText(/Account Type/)

    await step('Initially no business fields visible', async () => {
      expect(canvas.queryByLabelText(/Company Name/)).not.toBeInTheDocument()
      expect(canvas.queryByLabelText(/Business Email/)).not.toBeInTheDocument()
    })

    await step('Select business account', async () => {
      await userEvent.selectOptions(accountSelect, 'business')

      await waitFor(() => {
        expect(canvas.getByLabelText(/Company Name/)).toBeInTheDocument()
        expect(canvas.getByLabelText(/Business Email/)).toBeInTheDocument()
      })
    })

    await step('Test business field validation', async () => {
      const companyInput = canvas.getByLabelText(/Company Name/)
      const businessEmailInput = canvas.getByLabelText(/Business Email/)

      // Test short company name
      await userEvent.type(companyInput, 'A')
      await userEvent.tab()

      await waitFor(() => {
        expect(canvas.getByText(/Company name must be at least 2 characters/)).toBeInTheDocument()
      })

      // Test invalid business email
      await userEvent.type(businessEmailInput, 'invalid-email')
      await userEvent.tab()

      await waitFor(() => {
        expect(canvas.getByText(/Please enter a valid business email/)).toBeInTheDocument()
      })
    })

    await step('Switch back to personal - validation should stop', async () => {
      await userEvent.selectOptions(accountSelect, 'personal')

      await waitFor(() => {
        expect(canvas.queryByLabelText(/Company Name/)).not.toBeInTheDocument()
        expect(canvas.queryByLabelText(/Business Email/)).not.toBeInTheDocument()
      })
    })
  },
}

export const AsyncValidation: Story = {
  name: 'Async Validation',
  args: {
    showState: true,
  },
  render: (args) => {
    const AsyncValidationTest = () => {
      const [submitted, setSubmitted] = React.useState<any>(null)

      // Mock async validation function
      const checkUsernameAvailability = async (username: string): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const takenUsernames = ['admin', 'test', 'user']
        return !takenUsernames.includes(username.toLowerCase())
      }

      return (
      <div className="max-w-md p-4 bg-white rounded-lg shadow">
        <Form
          id="async-validation-test"
          fields={[
            FormFieldClass.text('username', {
              label: 'Username',
              placeholder: 'Try: admin, test, user (taken) or anything else',
              required: true,
              schema: z.string().min(3, 'Username must be at least 3 characters'),
              validateWithForm: async (value: string, formValues: any) => {
                if (!value || value.length < 3) return true // Let Zod handle this

                const isAvailable = await checkUsernameAvailability(value)
                return isAvailable || 'Username is already taken'
              },
            }),

            FormFieldClass.button('submit', {
              text: 'Submit',
              type: 'submit',
            }),
          ]}
          submit={(values) => {
            console.log('✅ Async validation form submitted:', values)
            setSubmitted(values)
          }}
          className="space-y-4"
        />

        {submitted && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            ✅ Form submitted successfully with username: {submitted.username}
          </div>
        )}

        {args.showState && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
            <h4 className="font-bold mb-2">Async Validation Demo:</h4>
            <ul className="text-xs space-y-1">
              <li>• Zod validation runs first (minimum length)</li>
              <li>• Then async availability check runs</li>
              <li>• Try typing 'admin', 'test', or 'user' (taken)</li>
              <li>• Other usernames will be available after 1 second</li>
            </ul>
          </div>
        )}
      </div>
      )
    }

    return <AsyncValidationTest />
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const usernameInput = canvas.getByLabelText(/Username/)

    await step('Test taken username', async () => {
      await userEvent.clear(usernameInput)
      await userEvent.type(usernameInput, 'admin')
      await userEvent.tab()

      // Wait for async validation to complete
      await waitFor(() => {
        expect(canvas.getByText(/Username is already taken/)).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    await step('Test available username', async () => {
      await userEvent.clear(usernameInput)
      await userEvent.type(usernameInput, 'myusername')
      await userEvent.tab()

      // Wait for async validation to complete and error to disappear
      await waitFor(() => {
        expect(canvas.queryByText(/Username is already taken/)).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })
  },
}