import { FormThemeSchema } from '../form-theme'

export const tailwindTheme = FormThemeSchema.parse({
  global: {
    input:
      'block w-full border px-3 py-2 sm:text-sm border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-300 focus:border-sky-300 ',
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
  },
  label: {
    base: 'block text-sm font-medium text-gray-700 mb-1',
    requiredIndicator: 'text-red-500 ml-1',
  },
  checkbox: {
    wrapper: '',
    row: 'flex items-center',
    rowFullWidth: 'flex items-center justify-between',
    input: 'h-4 w-4 text-green_web border-gray-300 rounded',
    error: '!border-red-600 !focus:border-red-600',
    disabled: 'opacity-50 cursor-not-allowed',
    label: 'ml-2 mt-0.5 block text-lg text-gray-900 flex-1 min-w-0',
    fullWidthLabel: 'pl-4',
    helpText: 'text-xs text-gray-500',
    errorText: 'text-xs text-red-600',
    readonlyCheckedIcon: (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    readonlyUncheckedIcon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },

  // Add more fields as needed
})
