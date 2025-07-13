import { FormTheme } from './form-theme'
import { createFinalTheme } from './utils/resolve-theme'

/**
 * Complete theme reference showing all available customization properties.
 * 
 * This object demonstrates every theme property you can customize in your forms.
 * Copy this structure and modify the values to create your custom theme.
 * 
 * @example
 * ```typescript
 * import { createFinalTheme, themeReference } from '@nestledjs/forms'
 * 
 * // Use this as a starting point for your custom theme
 * const myTheme = createFinalTheme({
 *   button: {
 *     primary: 'bg-blue-600 text-white hover:bg-blue-700',
 *   },
 *   textField: {
 *     input: 'border-2 border-gray-300 rounded-lg px-4 py-2',
 *   },
 *   // ... other customizations
 * })
 * ```
 */
export const themeReference: FormTheme = {
  // Global styles that get inherited by other field types
  global: {
    input: 'border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Form labels
  label: {
    base: 'block text-sm font-medium text-gray-700 mb-1',
    requiredIndicator: 'text-red-500 ml-1', // The asterisk for required fields
  },

  // Button component
  button: {
    base: 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors',
    primary: 'bg-sky-600 text-white hover:bg-sky-500 focus-visible:outline-sky-600',
    secondary: 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'opacity-100 animate-pulse',
    fullWidth: 'w-full',
  },

  // Text input fields
  textField: {
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    error: '!outline-red-600 !focus:outline-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    helpText: 'text-sm text-gray-600 mt-1',
  },

  // Standard HTML checkboxes
  checkbox: {
    wrapper: '',
    row: 'flex items-center gap-2',
    rowFullWidth: 'flex items-center justify-between',
    input: 'h-4 w-4 text-green_web rounded cursor-pointer',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    checked: 'bg-green_web border-green_web',
    indeterminate: 'bg-gray-300 border-gray-400',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed',
    readOnly: 'text-gray-700 font-medium',
    label: 'ml-2 text-base text-gray-900 cursor-pointer',
    fullWidthLabel: 'w-full break-words whitespace-normal',
    helpText: 'text-xs text-gray-500',
    errorText: 'text-xs text-red-600',
    readonlyCheckedIcon: null, // React element for read-only checked state
    readonlyUncheckedIcon: null, // React element for read-only unchecked state
  },

  // Custom styled checkboxes
  customCheckbox: {
    wrapper: '',
    row: 'flex items-center gap-2',
    rowFullWidth: 'flex items-center justify-between',
    checkboxContainer: 'relative inline-flex items-center cursor-pointer select-none',
    hiddenInput: 'peer absolute opacity-0 w-5 h-5 cursor-pointer',
    customCheckbox: 'inline-flex items-center justify-center w-5 h-5 rounded border border-gray-300 transition-colors bg-white mr-2 peer-focus:ring-2 peer-focus:ring-green-400 peer-focus:ring-offset-2',
    focus: '',
    checked: '!bg-green-500 border-green-500',
    error: '!border-red-600',
    disabled: 'opacity-50 cursor-not-allowed',
    readOnly: 'text-gray-700 font-medium',
    label: 'cursor-pointer select-none text-base text-gray-900',
    fullWidthLabel: 'w-full break-words whitespace-normal',
    helpText: 'text-xs text-gray-500',
    errorText: 'text-xs text-red-600',
    checkedIcon: null, // React element for checked state
    uncheckedIcon: null, // React element for unchecked state
    readonlyCheckedIcon: null, // React element for read-only checked state
    readonlyUncheckedIcon: null, // React element for read-only unchecked state
  },

  // Custom field wrapper
  customField: {
    wrapper: '',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    errorContainer: 'mt-2 p-3 bg-red-50 border border-red-200 rounded-md',
    errorText: 'text-sm text-red-600',
  },

  // Date picker fields
  datePicker: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Date-time picker fields
  dateTimePicker: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Email input fields
  emailField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Money/currency input fields
  moneyField: {
    wrapper: '',
    container: 'relative flex items-center',
    currencySymbol: 'absolute left-3 z-10 text-gray-500 pointer-events-none select-none flex items-center',
    currencySymbolHidden: 'hidden',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    inputWithSymbol: 'pl-12', // Extra padding when currency symbol is shown
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Multi-select dropdown fields
  multiSelect: {
    wrapper: '',
    container: 'relative',
    selectedItemsContainer: 'flex flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white p-1 pr-10 shadow-sm focus-within:ring-2 focus-within:ring-sky-300 focus-within:border-sky-300',
    selectedItem: 'flex items-center gap-x-1 whitespace-nowrap rounded-sm bg-sky-100 px-2 py-0.5 text-sm text-sky-700',
    selectedItemLabel: '',
    selectedItemRemoveButton: 'text-sky-500 hover:text-sky-800 transition-colors',
    input: 'min-w-[6rem] flex-grow bg-transparent p-1 focus:ring-0 border-none focus:outline-none',
    button: 'absolute inset-y-0 right-0 flex items-center pr-2',
    buttonIcon: 'h-5 w-5 text-gray-400',
    dropdown: 'absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm',
    option: 'cursor-pointer select-none relative py-2 pl-10 pr-4',
    optionActive: 'bg-sky-100 text-sky-900',
    optionSelected: 'font-medium',
    optionLabel: 'block truncate',
    optionCheckIcon: 'absolute inset-y-0 left-0 flex items-center pl-3 text-sky-600 h-5 w-5',
    error: '!border-red-600 !focus-within:border-red-600 !focus-within:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Number input fields
  numberField: {
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Password input fields
  passwordField: {
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 font-mono tracking-wider',
  },

  // Phone number input fields
  phoneField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300 !outline-none',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    errorMessage: 'text-xs sm:text-sm mt-2 mx-1 text-red-700',
  },

  // Radio button fields
  radioField: {
    wrapper: '',
    container: 'flex w-full',
    containerRow: 'flex-row gap-x-4',
    containerColumn: 'flex-col gap-y-1',
    optionContainer: 'flex',
    optionContainerFullWidth: 'w-full justify-between',
    optionContainerFancy: 'border rounded-md',
    radioContainer: 'flex flex-row items-center',
    input: 'size-4 appearance-none rounded-full border-2 border-gray-300 bg-white focus:outline-none cursor-pointer',
    inputFullWidth: '!size-6',
    inputChecked: '!bg-green-600 !border-green-600 shadow-[inset_0_0_0_3px_white]',
    inputFocus: 'focus:ring-green-500 focus:ring-2',
    inputDisabled: 'opacity-50 cursor-not-allowed',
    label: 'text-sm grow cursor-pointer',
    labelFullWidth: 'text-sm ml-2 grow',
    labelRow: 'p-1 pl-2',
    labelColumn: 'p-4',
    subOptionInput: 'grow block w-full px-3 py-2 sm:text-sm',
    subOptionError: '!border-red-600 !focus:border-red-600',
    readOnlyContainer: 'flex flex-row items-center',
    readOnlySelected: 'flex flex-row items-center',
    readOnlyUnselected: 'w-5 h-5 text-red-600',
    readOnlyIcon: null, // React element for read-only selected state
    readOnlyUnselectedIcon: null, // React element for read-only unselected state
  },

  // Search-enabled select fields
  searchSelectField: {
    wrapper: '',
    container: 'relative',
    input: 'w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10',
    button: 'absolute inset-y-0 right-0 flex items-center pr-2',
    buttonIcon: 'h-5 w-5 text-gray-400',
    dropdown: 'absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm',
    option: 'cursor-default select-none relative py-2 pl-10 pr-4',
    optionActive: 'text-white bg-sky-600',
    optionSelected: 'font-medium',
    optionLabel: 'block truncate',
    optionCheckIcon: 'absolute inset-y-0 left-0 flex items-center pl-3 text-sky-600 h-5 w-5',
    loadingText: 'p-2 text-sm text-gray-500',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 opacity-50 cursor-not-allowed bg-gray-100',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Multi-select with search
  searchSelectMultiField: {
    wrapper: '',
    container: 'relative',
    inputContainer: 'flex flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white p-1 pr-10 shadow-sm',
    selectedItem: 'flex items-center gap-x-1 whitespace-nowrap rounded-sm bg-orange-100 px-2 py-0.5 text-sm text-orange-700',
    selectedItemLabel: '',
    selectedItemRemoveButton: 'text-orange-500 hover:text-orange-800 transition-colors',
    selectedItemRemoveIcon: 'h-3 w-3',
    input: 'min-w-[6rem] flex-grow bg-transparent p-1 focus:ring-0 border-none focus:outline-none',
    button: 'absolute inset-y-0 right-0 flex items-center pr-2',
    buttonIcon: 'h-5 w-5 text-gray-400',
    dropdown: 'absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm',
    option: 'cursor-default select-none relative py-2 pl-10 pr-4',
    optionActive: 'text-white bg-orange-600',
    optionSelected: 'font-medium',
    optionLabel: 'block truncate',
    optionCheckIcon: 'absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600 h-5 w-5',
    loadingText: 'p-2 text-sm text-gray-500',
    noResultsText: 'p-2 text-sm text-gray-500',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 opacity-50 cursor-not-allowed bg-gray-100',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Standard select/dropdown fields
  selectField: {
    wrapper: '',
    container: 'relative',
    input: 'block w-full px-3 py-2 pr-12 sm:text-sm min-h-[2.5rem] appearance-none',
    arrow: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none', // NOT 'button'
    arrowIcon: 'h-5 w-5 text-gray-400', // NOT 'buttonIcon'
    option: 'cursor-pointer select-none relative py-2 pl-10 pr-4',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    helpText: 'text-sm text-gray-600 mt-1',
  },

  // Toggle switch fields
  switchField: {
    wrapper: '',
    container: 'flex items-center justify-between',
    label: 'ml-3 text-md text-gray-700',
    switchTrack: 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    switchTrackOn: 'bg-green-600 focus:ring-green-600',
    switchTrackOff: 'bg-gray-200 focus:ring-green-600',
    switchThumb: 'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
    switchThumbOn: 'translate-x-5',
    switchThumbOff: 'translate-x-0',
    error: '!border-red-600 !focus:ring-red-600',
    disabled: 'cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },

  // Textarea fields
  textAreaField: {
    wrapper: '',
    textarea: 'block w-full resize-none px-3 py-2 min-h-[2.5rem] border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 whitespace-pre-line',
    helpText: 'text-sm text-gray-600 mt-1',
  },

  // Time picker fields
  timePickerField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 text-green-600 min-h-[2.5rem]',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    helpText: 'text-sm text-gray-600 mt-1',
  },

  // URL input fields
  urlField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 text-blue-600 min-h-[2.5rem]',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 break-all',
    helpText: 'text-sm text-gray-600 mt-1',
  },

  // Markdown editor fields
  markdownEditor: {
    wrapper: '',
    editor: 'prose prose-sm max-w-none p-4',
    toolbar: 'border-b border-gray-200 p-2',
    preview: 'prose prose-sm max-w-none',
    error: '!border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'prose prose-sm max-w-none',
    helpText: 'text-sm text-gray-600 mt-1',
  },
}

/**
 * Utility function to generate a theme template JSON string.
 * This creates a JSON representation of the complete theme structure 
 * that you can copy, paste, and modify.
 * 
 * @example
 * ```typescript
 * import { generateThemeTemplate } from '@nestledjs/forms'
 * 
 * // Log the complete theme structure to console
 * console.log(generateThemeTemplate())
 * 
 * // Or save it to a file to use as a starting point
 * const fs = require('fs')
 * fs.writeFileSync('my-theme-template.json', generateThemeTemplate())
 * ```
 */
export function generateThemeTemplate(): string {
  // Create a template with empty strings for easy customization
  const template = {
    global: {
      input: '',
      error: '',
      disabled: '',
      readOnly: '',
    },
    label: {
      base: '',
      requiredIndicator: '',
    },
    button: {
      base: '',
      primary: '',
      secondary: '',
      danger: '',
      disabled: '',
      loading: '',
      fullWidth: '',
    },
    textField: {
      input: '',
      error: '',
      disabled: '',
      readOnly: '',
      helpText: '',
    },
    selectField: {
      wrapper: '',
      container: '',
      input: '',
      arrow: '', // ← Use 'arrow', not 'button'
      arrowIcon: '', // ← Use 'arrowIcon', not 'buttonIcon' 
      option: '',
      error: '',
      disabled: '',
      readOnly: '',
      readOnlyInput: '',
      readOnlyValue: '',
      helpText: '',
    },
    markdownEditor: {
      wrapper: '',
      editor: '',
      toolbar: '',
      preview: '',
      error: '',
      disabled: '',
      readOnly: '',
      readOnlyValue: '',
      helpText: '',
    },
    // Add more field types as needed...
  }
  
  return JSON.stringify(template, null, 2)
}

/**
 * Helper function to merge custom theme properties with the base tailwind theme.
 * This is useful when you want to override specific properties while keeping
 * the rest of the tailwind theme intact.
 * 
 * @param customizations - Partial theme object with your customizations
 * @returns Complete theme object ready to use
 * 
 * @example
 * ```typescript
 * import { createCustomTheme } from '@nestledjs/forms'
 * 
 * const myTheme = createCustomTheme({
 *   button: {
 *     primary: 'bg-blue-600 text-white hover:bg-blue-700',
 *   },
 *   selectField: {
 *     input: 'border-2 border-blue-300 rounded-lg',
 *   },
 * })
 * ```
 */
export function createCustomTheme(customizations: Partial<FormTheme>): FormTheme {
  return createFinalTheme(customizations)
} 