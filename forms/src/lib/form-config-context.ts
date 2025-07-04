import { createContext, useContext } from 'react';

/**
 * Configuration interface for form-wide settings.
 * 
 * @interface FormConfig
 * @property labelDisplay - Controls global label visibility: 'all' shows all labels, 'default' hides checkbox labels, 'none' hides all labels
 */
export interface FormConfig {
  labelDisplay: 'all' | 'default' | 'none';
}

// Create the context with a default value
export const FormConfigContext = createContext<FormConfig>({
  labelDisplay: 'default', // 'default' is the sensible default
});

/**
 * Hook to access form configuration settings within a Form component.
 * 
 * Provides access to form-wide configuration like label display preferences.
 * Useful for custom field components that need to respect global form settings.
 * 
 * Must be used within a Form component.
 * 
 * @returns The form configuration object
 * @throws Error if used outside of a Form component
 * 
 * @example
 * ```tsx
 * function CustomFieldWithLabel() {
 *   const { labelDisplay } = useFormConfig()
 *   
 *   const shouldShowLabel = labelDisplay === 'all' || 
 *     (labelDisplay === 'default' && fieldType !== 'checkbox')
 *   
 *   return (
 *     <div>
 *       {shouldShowLabel && <label>Field Label</label>}
 *       <input type="text" />
 *     </div>
 *   )
 * }
 * 
 * // Usage within a Form
 * <Form id="my-form" labelDisplay="none" submit={handleSubmit}>
 *   <CustomFieldWithLabel />
 * </Form>
 * ```
 */
export function useFormConfig() {
  const context = useContext(FormConfigContext);
  if (!context) {
    // This should theoretically never happen if used correctly
    throw new Error('useFormConfig must be used within a <Form> component.');
  }
  return context;
} 