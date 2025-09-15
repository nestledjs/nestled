import { ZodTypeAny, ZodError } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldValues, RegisterOptions, Resolver } from 'react-hook-form'
import { BaseFieldOptions, InputFieldOptions } from '../form-types'

/**
 * Creates validation rules for a field that combine Zod schema validation
 * with traditional validation functions.
 *
 * @param field - The field configuration containing validation options
 * @param isRequired - Whether the field is currently required (considering dynamic conditions)
 * @returns RegisterOptions for react-hook-form register function
 */
export function createFieldValidation(
  field: InputFieldOptions,  // InputFieldOptions extends BaseFieldOptions and has validate
  isRequired: boolean,
  currentValidationGroup?: string
): RegisterOptions {
  const rules: RegisterOptions = {}

  // Add required validation
  if (isRequired) {
    rules.required = field.errorMessages?.required || 'This field is required'
  }

  // Add Zod schema validation if present
  if (field.schema) {
    rules.validate = rules.validate || {}

    // Add Zod validation - always accepts formValues even if not used
    const zodValidate = async (value: any, formValues?: any) => {
      try {
        await field.schema!.parseAsync(value)
        return true
      } catch (error) {
        if (error instanceof ZodError) {
          // Get the first error message
          const firstError = error.errors[0]
          const errorKey = firstError.code

          // Check for custom error message
          if (field.errorMessages?.[errorKey]) {
            return field.errorMessages[errorKey] as string
          }

          // Return Zod's error message
          return firstError.message
        }
        return 'Invalid value'
      }
    }

    if (typeof rules.validate === 'object') {
      rules.validate.schema = zodValidate
    } else {
      rules.validate = zodValidate
    }
  }

  // Add custom validation function if present
  if (field.validate) {
    if (!rules.validate) {
      rules.validate = field.validate
    } else if (typeof rules.validate === 'object') {
      // Combine with Zod validation
      rules.validate.custom = field.validate
    } else {
      // Create a combined validator
      const zodValidate = rules.validate
      rules.validate = async (value: any, formValues: any) => {
        // Run Zod validation first - pass both parameters
        const zodResult = await zodValidate(value, formValues)
        if (zodResult !== true) return zodResult

        // Then run custom validation - only pass value since validate expects one param
        return field.validate!(value)
      }
    }
  }

  // Add cross-field validation if present
  // Note: react-hook-form's validate function signature is (value, formValues)
  // where formValues is automatically provided by react-hook-form
  if (field.validateWithForm) {
    if (!rules.validate) {
      rules.validate = field.validateWithForm
    } else if (typeof rules.validate === 'object') {
      // Add to object validators
      rules.validate.crossField = field.validateWithForm
    } else {
      // Combine with existing validation
      const existingValidate = rules.validate
      rules.validate = async (value: any, formValues: any) => {
        // Run existing validation first - pass both parameters
        const existingResult = await existingValidate(value, formValues)
        if (existingResult !== true) return existingResult

        // Then run cross-field validation with both parameters
        return field.validateWithForm!(value, formValues)
      }
    }
  }

  // Wrap validation with conditional and group checks
  if (rules.validate && (field.validateWhen || field.validationGroup)) {
    const originalValidate = rules.validate

    // Always preserve the (value, formValues) signature
    rules.validate = async (value: any, formValues: any) => {
      // Check if this field should be validated based on conditions
      if (field.validateWhen && !field.validateWhen(formValues)) {
        return true // Skip validation
      }

      // Check if this field belongs to the current validation group
      if (currentValidationGroup && field.validationGroup && field.validationGroup !== currentValidationGroup) {
        return true // Skip validation - not in current group
      }

      // Run the original validation - always pass both parameters
      if (typeof originalValidate === 'function') {
        return originalValidate(value, formValues)
      } else if (typeof originalValidate === 'object') {
        // Run all validators in the object
        for (const [key, validator] of Object.entries(originalValidate)) {
          if (typeof validator === 'function') {
            const result = await validator(value, formValues)
            if (result !== true) return result
          }
        }
        return true
      }

      return true
    }
  }

  return rules
}

/**
 * Creates a form-level resolver that can handle both Zod schemas and field-level validation.
 * This allows for mixed validation strategies within the same form.
 *
 * @param schema - Optional Zod schema for form-level validation
 * @param fields - Array of form fields with their validation configurations
 * @returns A resolver function for react-hook-form
 */
export function createFormResolver<TFieldValues extends FieldValues = FieldValues>(
  schema?: ZodTypeAny,
  fields?: Array<{ key: string; options: InputFieldOptions }>,
  currentValidationGroup?: string,
  validationGroups?: string[]
): Resolver<TFieldValues> | undefined {
  // If we have a form-level Zod schema, use the zodResolver
  if (schema) {
    return zodResolver(schema) as Resolver<TFieldValues>
  }

  // Check if we need a custom resolver for field-level validation
  // Note: Button fields should already be filtered out before calling this function
  const fieldsNeedingValidation = fields?.filter(f =>
    f.options.schema || f.options.validateWithForm || f.options.validate
  )
  if (!fieldsNeedingValidation?.length) {
    return undefined
  }

  // Create a custom resolver that handles all field-level validation
  return async (values, context, options) => {
    const errors: Record<string, any> = {}

    for (const field of fieldsNeedingValidation) {
      const value = values[field.key as keyof TFieldValues]
      const fieldOptions = field.options

      // Check if this field should be validated based on conditions
      if (fieldOptions.validateWhen && !fieldOptions.validateWhen(values)) {
        // Skip validation if validateWhen returns false
        continue
      }

      // Check if field is required (either statically or conditionally)
      const isRequired = fieldOptions.required ||
        (fieldOptions.requiredWhen && fieldOptions.requiredWhen(values))

      if (isRequired && !value) {
        errors[field.key] = {
          type: 'required',
          message: fieldOptions.errorMessages?.required || 'This field is required'
        }
        continue
      }

      // Run Zod schema validation
      if (fieldOptions.schema) {
        try {
          await fieldOptions.schema.parseAsync(value)
        } catch (error) {
          if (error instanceof ZodError) {
            const firstError = error.errors[0]
            const errorKey = firstError.code

            errors[field.key] = {
              type: errorKey,
              message: fieldOptions.errorMessages?.[errorKey] || firstError.message
            }
            continue
          }
        }
      }

      // Run validate function
      if (fieldOptions.validate) {
        const result = await fieldOptions.validate(value)
        if (result !== true) {
          errors[field.key] = {
            type: 'validate',
            message: result as string
          }
          continue
        }
      }

      // Run validateWithForm function
      if (fieldOptions.validateWithForm) {
        const result = await fieldOptions.validateWithForm(value, values)
        if (result !== true) {
          errors[field.key] = {
            type: 'validateWithForm',
            message: result as string
          }
        }
      }
    }

    return {
      values: Object.keys(errors).length ? {} : values,
      errors
    }
  }
}

/**
 * Creates a validation function that only validates fields in a specific group.
 * Useful for multi-step forms where you want to validate only the current step.
 *
 * @param form - The react-hook-form instance
 * @param validationGroup - The group to validate
 * @param fields - Array of form fields
 * @returns Promise that resolves to true if valid, or validation errors
 */
export async function validateGroup<T extends FieldValues>(
  form: { getValues: () => T; trigger: (names?: string[]) => Promise<boolean> },
  validationGroup: string,
  fields: Array<{ key: string; options: BaseFieldOptions & { validationGroup?: string } }>
): Promise<boolean> {
  // Get field names that belong to this validation group
  const groupFields = fields
    .filter(field => field.options.validationGroup === validationGroup)
    .map(field => field.key)

  if (groupFields.length === 0) return true

  // Trigger validation only for fields in this group
  return await form.trigger(groupFields)
}

/**
 * Gets all validation groups present in the form fields.
 *
 * @param fields - Array of form fields
 * @returns Array of unique validation group names
 */
export function getValidationGroups(
  fields: Array<{ key: string; options: BaseFieldOptions & { validationGroup?: string } }>
): string[] {
  const groups = new Set<string>()

  fields.forEach(field => {
    if (field.options.validationGroup) {
      groups.add(field.options.validationGroup)
    }
  })

  return Array.from(groups).sort()
}

/**
 * Gets all fields that belong to a specific validation group.
 *
 * @param fields - Array of form fields
 * @param validationGroup - The group to filter by
 * @returns Array of fields in the specified group
 */
export function getFieldsInGroup(
  fields: Array<{ key: string; options: BaseFieldOptions & { validationGroup?: string } }>,
  validationGroup: string
): Array<{ key: string; options: BaseFieldOptions & { validationGroup?: string } }> {
  return fields.filter(field => field.options.validationGroup === validationGroup)
}

/**
 * Checks if a field should be validated based on current form values and validation conditions.
 *
 * @param field - The field to check
 * @param formValues - Current form values
 * @param currentValidationGroup - Current validation group (if any)
 * @returns true if field should be validated, false otherwise
 */
export function shouldValidateField(
  field: { options: BaseFieldOptions & {
    validateWhen?: (formValues: any) => boolean
    validationGroup?: string
  }},
  formValues: any,
  currentValidationGroup?: string
): boolean {
  // Check conditional validation
  if (field.options.validateWhen && !field.options.validateWhen(formValues)) {
    return false
  }

  // Check validation group
  if (currentValidationGroup && field.options.validationGroup &&
      field.options.validationGroup !== currentValidationGroup) {
    return false
  }

  return true
}

/**
 * Utility to extract TypeScript types from Zod schemas for better type inference
 */
export type InferSchemaType<T> = T extends ZodTypeAny ? T['_output'] : never