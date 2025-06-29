import { z } from 'zod'

export const FormThemeSchema = z.object({
  global: z
    .object({
      input: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
    })
    .default({}),
  label: z
    .object({
      base: z.string().default(''),
      requiredIndicator: z.string().default(''),
    })
    .default({}),
  textField: z
    .object({
      input: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
    })
    .default({}),
  checkbox: z
    .object({
      wrapper: z.string().default(''),
      row: z.string().default(''),
      rowFullWidth: z.string().default(''),
      input: z.string().default(''),
      focus: z.string().default(''),
      checked: z.string().default(''),
      indeterminate: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      label: z.string().default(''),
      fullWidthLabel: z.string().default(''),
      helpText: z.string().default(''),
      errorText: z.string().default(''),
      readonlyCheckedIcon: z.any().optional(),
      readonlyUncheckedIcon: z.any().optional(),
    })
    .default({}),
  customCheckbox: z
    .object({
      wrapper: z.string().default(''),
      row: z.string().default(''),
      rowFullWidth: z.string().default(''),
      checkboxContainer: z.string().default(''),
      hiddenInput: z.string().default(''),
      customCheckbox: z.string().default(''),
      focus: z.string().default(''),
      checked: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      label: z.string().default(''),
      fullWidthLabel: z.string().default(''),
      helpText: z.string().default(''),
      errorText: z.string().default(''),
      checkedIcon: z.any().optional(),
      uncheckedIcon: z.any().optional(),
      readonlyCheckedIcon: z.any().optional(),
      readonlyUncheckedIcon: z.any().optional(),
    })
    .default({}),
  customField: z
    .object({
      wrapper: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
      errorContainer: z.string().default(''),
      errorText: z.string().default(''),
    })
    .default({}),
  datePicker: z
    .object({
      wrapper: z.string().default(''),
      input: z.string().default(''),
      focus: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  dateTimePicker: z
    .object({
      wrapper: z.string().default(''),
      input: z.string().default(''),
      focus: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  button: z
    .object({
      base: z.string().default(''),
      primary: z.string().default(''),
      secondary: z.string().default(''),
      danger: z.string().default(''),
      disabled: z.string().default(''),
      loading: z.string().default(''),
    })
    .default({}),
  emailField: z
    .object({
      wrapper: z.string().default(''),
      input: z.string().default(''),
      focus: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  moneyField: z
    .object({
      wrapper: z.string().default(''),
      container: z.string().default(''),
      currencySymbol: z.string().default(''),
      currencySymbolHidden: z.string().default(''),
      input: z.string().default(''),
      inputWithSymbol: z.string().default(''),
      focus: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  multiSelect: z
    .object({
      wrapper: z.string().default(''),
      container: z.string().default(''),
      selectedItemsContainer: z.string().default(''),
      selectedItem: z.string().default(''),
      selectedItemLabel: z.string().default(''),
      selectedItemRemoveButton: z.string().default(''),
      input: z.string().default(''),
      button: z.string().default(''),
      buttonIcon: z.string().default(''),
      dropdown: z.string().default(''),
      option: z.string().default(''),
      optionActive: z.string().default(''),
      optionSelected: z.string().default(''),
      optionLabel: z.string().default(''),
      optionCheckIcon: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  numberField: z
    .object({
      input: z.string().default(''),
      focus: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  passwordField: z
    .object({
      input: z.string().default(''),
      focus: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  phoneField: z
    .object({
      wrapper: z.string().default(''),
      input: z.string().default(''),
      focus: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
      errorMessage: z.string().default(''),
    })
    .default({}),
  radioField: z
    .object({
      wrapper: z.string().default(''),
      container: z.string().default(''),
      containerRow: z.string().default(''),
      containerColumn: z.string().default(''),
      optionContainer: z.string().default(''),
      optionContainerFullWidth: z.string().default(''),
      optionContainerFancy: z.string().default(''),
      radioContainer: z.string().default(''),
      input: z.string().default(''),
      inputFullWidth: z.string().default(''),
      inputChecked: z.string().default(''),
      inputFocus: z.string().default(''),
      inputDisabled: z.string().default(''),
      label: z.string().default(''),
      labelFullWidth: z.string().default(''),
      labelRow: z.string().default(''),
      labelColumn: z.string().default(''),
      subOptionInput: z.string().default(''),
      subOptionError: z.string().default(''),
      readOnlyContainer: z.string().default(''),
      readOnlySelected: z.string().default(''),
      readOnlyUnselected: z.string().default(''),
      readOnlyIcon: z.any().optional(),
      readOnlyUnselectedIcon: z.any().optional(),
    })
    .default({}),
  searchSelectField: z
    .object({
      wrapper: z.string().default(''),
      container: z.string().default(''),
      input: z.string().default(''),
      button: z.string().default(''),
      buttonIcon: z.string().default(''),
      dropdown: z.string().default(''),
      option: z.string().default(''),
      optionActive: z.string().default(''),
      optionSelected: z.string().default(''),
      optionLabel: z.string().default(''),
      optionCheckIcon: z.string().default(''),
      loadingText: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  searchSelectMultiField: z
    .object({
      wrapper: z.string().default(''),
      container: z.string().default(''),
      inputContainer: z.string().default(''),
      selectedItem: z.string().default(''),
      selectedItemLabel: z.string().default(''),
      selectedItemRemoveButton: z.string().default(''),
      selectedItemRemoveIcon: z.string().default(''),
      input: z.string().default(''),
      button: z.string().default(''),
      buttonIcon: z.string().default(''),
      dropdown: z.string().default(''),
      option: z.string().default(''),
      optionActive: z.string().default(''),
      optionSelected: z.string().default(''),
      optionLabel: z.string().default(''),
      optionCheckIcon: z.string().default(''),
      loadingText: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  selectField: z
    .object({
      wrapper: z.string().default(''),
      container: z.string().default(''),
      input: z.string().default(''),
      button: z.string().default(''),
      buttonIcon: z.string().default(''),
      dropdown: z.string().default(''),
      option: z.string().default(''),
      optionActive: z.string().default(''),
      optionSelected: z.string().default(''),
      optionLabel: z.string().default(''),
      optionCheckIcon: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyInput: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  switchField: z
    .object({
      wrapper: z.string().default(''),
      container: z.string().default(''),
      label: z.string().default(''),
      switchTrack: z.string().default(''),
      switchTrackOn: z.string().default(''),
      switchTrackOff: z.string().default(''),
      switchThumb: z.string().default(''),
      switchThumbOn: z.string().default(''),
      switchThumbOff: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  textAreaField: z
    .object({
      wrapper: z.string().default(''),
      textarea: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  timePickerField: z
    .object({
      wrapper: z.string().default(''),
      input: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  urlField: z
    .object({
      wrapper: z.string().default(''),
      input: z.string().default(''),
      error: z.string().default(''),
      disabled: z.string().default(''),
      readOnly: z.string().default(''),
      readOnlyValue: z.string().default(''),
    })
    .default({}),
  // Add more fields as needed
})

export type FormTheme = z.infer<typeof FormThemeSchema>
