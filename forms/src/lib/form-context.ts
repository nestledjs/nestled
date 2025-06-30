import { createContext, useContext } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'

// The context will hold the entire return value of useForm()
export const FormContext = createContext<UseFormReturn<FieldValues> | null>(null)

// A helper hook to easily access the context and provide a helpful error message.
export function useFormContext<T extends FieldValues = FieldValues>() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('FormField components must be used within a <Form> component.')
  }
  return context as UseFormReturn<T>
}
