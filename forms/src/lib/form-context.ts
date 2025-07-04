import { createContext, useContext } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'

// The context will hold the entire return value of useForm()
export const FormContext = createContext<UseFormReturn<FieldValues> | null>(null)

/**
 * Hook to access the form context and methods within a Form component.
 * 
 * Provides access to react-hook-form's useForm return value, including
 * form state, validation methods, and field registration.
 * 
 * Must be used within a Form component.
 * 
 * @template T - The type of the form values object
 * @returns The form context object with methods like register, setValue, getValues, formState, etc.
 * @throws Error if used outside of a Form component
 * 
 * @example
 * ```tsx
 * function CustomField() {
 *   const form = useFormContext<{ username: string }>()
 *   
 *   return (
 *     <input
 *       {...form.register('username', { required: true })}
 *       className={form.formState.errors.username ? 'error' : ''}
 *     />
 *   )
 * }
 * 
 * // Usage within a Form
 * <Form id="my-form" submit={handleSubmit}>
 *   <CustomField />
 * </Form>
 * ```
 */
export function useFormContext<T extends FieldValues = FieldValues>() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormField components must be used within a <Form> component.')
  }
  return context as UseFormReturn<T>
}
