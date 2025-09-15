import { useMemo } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'
import { createFieldValidation } from '../utils/validation'
import { InputFieldOptions } from '../form-types'

/**
 * Hook that provides validation rules for a form field,
 * including support for Zod schemas, cross-field validation, and conditional validation.
 *
 * @param field - The field configuration
 * @param form - The form instance from react-hook-form
 * @returns RegisterOptions to use with form.register()
 */
export function useFieldValidation<TFieldValues extends FieldValues = FieldValues>(
  field: {
    key: string
    options: InputFieldOptions  // InputFieldOptions extends BaseFieldOptions and has validate
  },
  form: UseFormReturn<TFieldValues>
) {
  const validationRules = useMemo(() => {
    // For now, use static required - dynamic required will be handled in validation
    const isRequired = field.options.required || false

    // Get the current validation group from form context if available
    // For now, we'll pass undefined since validation groups are handled at form level
    const currentValidationGroup = undefined

    return createFieldValidation(
      field.options,
      isRequired,
      currentValidationGroup
    )
  }, [
    // Use stable references for the field options
    field.key,
    field.options.required,
    field.options.schema,
    // Don't use function references as dependencies - they might change on every render
    // The validation functions themselves will be stable inside createFieldValidation
  ])

  return validationRules
}