import { FormThemeSchema } from '../form-theme'

export const tailwindTheme = FormThemeSchema.parse({
  global: {
    input:
      'border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  button: {
    base: 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors',
    primary: 'bg-sky-600 text-white hover:bg-sky-500 focus-visible:outline-sky-600',
    secondary: 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'opacity-100 animate-pulse',
    fullWidth: 'w-full',
  },
  label: {
    base: 'block text-sm font-medium text-gray-700 mb-1',
    requiredIndicator: 'text-red-500 ml-1',
  },
  textField: {
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    error: '!outline-red-600 !focus:outline-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  checkbox: {
    wrapper: '',
    row: 'flex items-center gap-2',
    rowFullWidth: 'flex items-center justify-between',
    input: 'h-4 w-4 text-sky-600 rounded cursor-pointer',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    checked: 'bg-sky-600 border-sky-600',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed',
    readOnly: 'text-gray-700 font-medium',
    label: 'ml-2 text-base text-gray-900 cursor-pointer',
    fullWidthLabel: 'w-full break-words whitespace-normal',
    helpText: 'text-xs text-gray-500',
    errorText: 'text-xs text-red-600',
    indeterminate: 'bg-gray-300 border-gray-400',
    readonlyCheckedIcon: (
      <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    readonlyUncheckedIcon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  customCheckbox: {
    wrapper: '',
    row: 'flex items-center gap-2',
    rowFullWidth: 'flex items-center justify-between',
    checkboxContainer: 'relative inline-flex items-center cursor-pointer select-none',
    hiddenInput: 'peer absolute opacity-0 w-5 h-5 cursor-pointer',
    customCheckbox:
      'inline-flex items-center justify-center w-5 h-5 rounded border border-gray-300 transition-colors bg-white mr-2 peer-focus:ring-2 peer-focus:ring-sky-300 peer-focus:ring-offset-2',
    focus: '', // Empty since focus styles are now in customCheckbox
    checked: '!bg-sky-600 border-sky-600',
    error: '!border-red-600',
    disabled: 'opacity-50 cursor-not-allowed',
    readOnly: 'text-gray-700 font-medium',
    label: 'cursor-pointer select-none text-base text-gray-900',
    fullWidthLabel: 'w-full break-words whitespace-normal',
    helpText: 'text-xs text-gray-500',
    errorText: 'text-xs text-red-600',
    checkedIcon: (
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    uncheckedIcon: null, // No icon when unchecked by default
    readonlyCheckedIcon: (
      <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    readonlyUncheckedIcon: (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  customField: {
    wrapper: '',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    errorContainer: 'mt-2 p-3 bg-red-50 border border-red-200 rounded-md',
    errorText: 'text-sm text-red-600',
  },
  datePicker: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  dateTimePicker: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  emailField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  moneyField: {
    wrapper: '',
    container: 'relative flex items-center',
    currencySymbol: 'absolute left-3 z-10 text-gray-500 pointer-events-none select-none flex items-center',
    currencySymbolHidden: 'hidden',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    inputWithSymbol: 'pl-12', // Additional left padding when symbol is visible (increased for longer symbols)
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  multiSelect: {
    wrapper: '',
    container: 'relative',
    inputContainer:
      'flex flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white p-1 pr-10 shadow-sm focus-within:ring-2 focus-within:ring-sky-300 focus-within:border-sky-300',
    selectedItem: 'flex items-center gap-x-1 whitespace-nowrap rounded-sm bg-sky-100 px-2 py-0.5 text-sm text-sky-700',
    selectedItemLabel: '',
    selectedItemRemoveButton: 'text-sky-500 hover:text-sky-800 transition-colors',
    selectedItemRemoveIcon: 'h-3 w-3',
    input: 'min-w-[6rem] flex-grow bg-transparent p-1 focus:ring-0 border-none focus:outline-none',
    button: 'absolute inset-y-0 right-0 flex items-center pr-2',
    buttonIcon: 'h-5 w-5 text-gray-400',
    dropdown:
      'absolute z-10 mt-1 w-fit min-w-[12rem] bg-white shadow-lg max-h-60 rounded-md py-1 text-base border border-gray-300 overflow-auto focus:outline-none sm:text-sm',
    option: 'cursor-pointer select-none relative py-2 pl-10 pr-4',
    optionActive: 'bg-sky-100 text-sky-900',
    optionSelected: 'font-medium',
    optionLabel: 'block truncate',
    optionCheckIcon: 'absolute inset-y-0 left-0 flex items-center pl-3 text-sky-600',
    error: '!border-red-600 !focus-within:border-red-600 !focus-within:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  numberField: {
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  passwordField: {
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 font-mono tracking-wider',
  },
  phoneField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    focus: 'focus:ring-2 focus:ring-sky-300 focus:border-sky-300 !outline-none',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    errorMessage: 'text-xs sm:text-sm mt-2 mx-1 text-red-700',
  },
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
    inputChecked: '!bg-sky-600 !border-sky-600 shadow-[inset_0_0_0_3px_white]',
    inputFocus: 'focus:ring-sky-300 focus:ring-2',
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
    readOnlyIcon: (
      <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    readOnlyUnselectedIcon: (
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  checkboxGroup: {
    wrapper: '',
    container: 'flex w-full',
    containerRow: 'flex-row gap-x-4',
    containerColumn: 'flex-col gap-y-1',
    optionContainer: 'flex',
    optionContainerFullWidth: 'w-full justify-between',
    optionContainerFancy: 'border rounded-md',
    checkboxContainer: 'flex flex-row items-center',
    input: 'size-4 appearance-none rounded border-2 border-gray-300 bg-white focus:outline-none cursor-pointer',
    inputFullWidth: '!size-6',
    inputChecked: '!bg-sky-600 !border-sky-600 shadow-[inset_0_0_0_2px_white]',
    inputFocus: 'focus:ring-sky-300 focus:ring-2',
    inputDisabled: 'opacity-50 cursor-not-allowed',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    label: 'text-sm grow cursor-pointer',
    labelFullWidth: 'text-sm ml-2 grow',
    labelRow: 'p-1 pl-2',
    labelColumn: 'p-4',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-start px-3 py-2 text-gray-700',
    readOnlyContainer: 'flex flex-col gap-y-1',
    readOnlySelected: 'flex flex-row items-center gap-x-2',
    readOnlyUnselected: 'text-gray-500 italic',
    helpText: 'text-sm text-gray-600 mt-1',
  },
  searchSelectField: {
    wrapper: '',
    container: 'relative',
    input: 'w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10',
    button: 'absolute inset-y-0 right-0 flex items-center pr-2',
    buttonIcon: 'h-5 w-5 text-gray-400',
    dropdown:
      'absolute z-10 mt-1 w-fit min-w-[12rem] bg-white shadow-lg max-h-60 rounded-md py-1 text-base border border-gray-300 overflow-auto focus:outline-none sm:text-sm',
    option: 'cursor-default select-none relative py-2 pl-10 pr-4',
    optionActive: 'text-white bg-sky-600',
    optionSelected: 'font-medium',
    optionLabel: 'block truncate',
    optionCheckIcon: 'absolute inset-y-0 left-0 flex items-center pl-3 text-sky-600',
    loadingText: 'p-2 text-sm text-gray-500',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 opacity-50 cursor-not-allowed bg-gray-100',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    fallback: 'h-10 w-full rounded-md border border-gray-300 bg-gray-100',
  },
  searchSelectMultiField: {
    wrapper: '',
    container: 'relative',
    inputContainer: 'flex flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white p-1 pr-10 shadow-sm',
    selectedItem: 'flex items-center gap-x-1 whitespace-nowrap rounded-sm bg-sky-100 px-2 py-0.5 text-sm text-sky-700',
    selectedItemLabel: '',
    selectedItemRemoveButton: 'text-sky-500 hover:text-sky-800 transition-colors',
    selectedItemRemoveIcon: 'h-3 w-3',
    input: 'min-w-[6rem] flex-grow bg-transparent p-1 focus:ring-0 border-none focus:outline-none',
    button: 'absolute inset-y-0 right-0 flex items-center pr-2',
    buttonIcon: 'h-5 w-5 text-gray-400',
    dropdown:
      'absolute z-10 mt-1 w-fit min-w-[12rem] bg-white shadow-lg max-h-60 rounded-md py-1 text-base border border-gray-300 overflow-auto focus:outline-none sm:text-sm',
    option: 'cursor-default select-none relative py-2 pl-10 pr-4',
    optionActive: 'text-white bg-sky-600',
    optionSelected: 'font-medium',
    optionLabel: 'block truncate',
    optionCheckIcon: 'absolute inset-y-0 left-0 flex items-center pl-3 text-sky-600',
    loadingText: 'p-2 text-sm text-gray-500',
    noResultsText: 'p-2 text-sm text-gray-500',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 opacity-50 cursor-not-allowed bg-gray-100',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    fallback: 'h-10 w-full rounded-md border border-gray-300 bg-gray-100',
  },
  selectField: {
    wrapper: '',
    container: 'relative',
    input: 'block w-full px-3 py-2 pr-12 sm:text-sm min-h-[2.5rem] appearance-none',
    arrow: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none',
    arrowIcon: 'h-5 w-5 text-gray-400',
    option: 'py-1 px-3',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    readOnly: 'text-gray-700 font-medium',
    readOnlyInput:
      'min-h-[2.5rem] flex items-center px-3 text-gray-700 w-full border border-gray-300 rounded bg-gray-50',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    helpText: 'text-sm text-gray-600 mt-1',
    fallback: 'h-10 w-full rounded-md border border-gray-300 bg-gray-100',
  },
  switchField: {
    wrapper: '',
    container: 'flex items-center justify-between',
    label: 'ml-3 text-md text-gray-700',
    switchTrack:
      'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    switchTrackOn: 'bg-sky-600 focus:ring-sky-300',
    switchTrackOff: 'bg-gray-200 focus:ring-sky-300',
    switchThumb:
      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
    switchThumbOn: 'translate-x-5',
    switchThumbOff: 'translate-x-0',
    error: '!border-red-600 !focus:ring-red-600',
    disabled: 'cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
    helpText: 'text-sm text-gray-600 mt-1',
  },
  textAreaField: {
    wrapper: '',
    textarea:
      'block w-full resize-none px-3 py-2 min-h-[2.5rem] border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-300 focus:border-sky-300',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 whitespace-pre-line',
    helpText: 'text-sm text-gray-600 mt-1',
  },
  markdownEditor: {
    wrapper: '',
    editor:
      'border border-gray-300 rounded-md focus-within:ring-sky-300 focus-within:border-sky-300 prose prose-sm max-w-none p-4',
    toolbar: 'bg-gray-50 border-b border-gray-200 px-3 py-2 rounded-t-md',
    preview: 'prose prose-sm max-w-none p-4 min-h-[200px] bg-white',
    error: '!border-red-600 !focus-within:border-red-600 !focus-within:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'prose prose-sm max-w-none p-4 min-h-[200px] bg-gray-50 text-gray-700',
    helpText: 'text-sm text-gray-600 mt-1',
  },
  timePickerField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700',
  },
  urlField: {
    wrapper: '',
    input: 'block w-full px-3 py-2 sm:text-sm min-h-[2.5rem]',
    error: '!border-red-600 !focus:border-red-600 !focus:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    readOnly: 'text-gray-700 font-medium',
    readOnlyValue: 'min-h-[2.5rem] flex items-center px-3 text-gray-700 break-all',
  },

  // Add more fields as needed
})
