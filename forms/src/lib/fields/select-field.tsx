import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType, SelectOption } from '../form-types'
import { ClientOnly } from '../utils/client-only'
import { Controller } from 'react-hook-form'
import { useFormTheme } from '../theme-context'

export function SelectField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: FormFieldProps<Extract<FormField, { type: FormFieldType.Select } | { type: FormFieldType.EnumSelect }>> & { formReadOnly?: boolean, formReadOnlyStyle?: 'value' | 'disabled' }) {
  const theme = useFormTheme()
  
  // Support both Select and EnumSelect
  let options: SelectOption[] = []
  if (field.type === FormFieldType.Select) {
    options = field.options.options || []
  } else if (field.type === FormFieldType.EnumSelect) {
    options = Object.keys(field.options.enum || {}).map((key) => ({ label: key, value: key }))
  }
  const defaultValue = options.find((o) => o.value === field.options.defaultValue) || null
  const isReadOnly = field.options.readOnly ?? formReadOnly;
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
  const value = form.getValues(field.key);
  const selectedOption = options.find((o) => o.value === value) || null;

  if (isReadOnly) {
    if (readOnlyStyle === 'disabled') {
      return (
        <input
          type="text"
          className={clsx(
            theme.selectField.readOnlyInput,
            hasError && theme.selectField.error
          )}
          disabled={true}
          value={selectedOption?.label ?? ''}
        />
      );
    }
    // Render as plain value
    return (
      <div className={theme.selectField.readOnlyValue}>{selectedOption?.label ?? '—'}</div>
    );
  }

  return (
    <ClientOnly fallback={<div className="h-10 w-full rounded-md border border-gray-300 bg-gray-100" />}> 
      <Controller
        name={field.key}
        control={form.control}
        defaultValue={defaultValue?.value ?? null}
        render={({ field: { onChange, value } }) => (
          <Combobox
            value={options.find(o => o.value === value) ?? null}
            onChange={(selected: SelectOption | null) => onChange(selected?.value ?? null)}
            disabled={field.options.disabled}
          >
            <div className={theme.selectField.container}>
              <ComboboxInput
                className={clsx(
                  theme.selectField.input,
                  hasError && theme.selectField.error,
                  field.options.disabled && theme.selectField.disabled,
                )}
                displayValue={(option: SelectOption | null) => option?.label ?? ''}
                placeholder={field.options.label}
                disabled={field.options.disabled}
              />
              <ComboboxButton className={theme.selectField.button}>
                <svg className={theme.selectField.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </ComboboxButton>
            </div>
            <ComboboxOptions className={theme.selectField.dropdown}>
              {options.map((option) => (
                <ComboboxOption
                  key={option.value}
                  value={option}
                  className={({ active }) =>
                    clsx(
                      theme.selectField.option,
                      active ? theme.selectField.optionActive : 'text-gray-900'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx(
                        theme.selectField.optionLabel,
                        selected ? theme.selectField.optionSelected : 'font-normal'
                      )}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className={theme.selectField.optionCheckIcon}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : null}
                    </>
                  )}
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </Combobox>
        )}
      />
    </ClientOnly>
  )
}
