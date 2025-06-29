import { createContext, useContext } from 'react';

// Define the shape of our form-wide configuration
export interface FormConfig {
  labelDisplay: 'all' | 'default' | 'none';
}

// Create the context with a default value
export const FormConfigContext = createContext<FormConfig>({
  labelDisplay: 'default', // 'default' is the sensible default
});

// A helper hook for easy access and a helpful error message
export function useFormConfig() {
  const context = useContext(FormConfigContext);
  if (!context) {
    // This should theoretically never happen if used correctly
    throw new Error('useFormConfig must be used within a <Form> component.');
  }
  return context;
} 