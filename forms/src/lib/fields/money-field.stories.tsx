import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, CurrencyFieldOptions, CurrencyCode } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, fn } from 'storybook/test'
import { getCurrencyOptions } from '../utils/currency'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

const generateMoneyFieldCode = (args: MoneyFieldStoryArgs) => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const options: string[] = []
  
  if (args.label !== 'Amount') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue) options.push(`defaultValue: ${args.defaultValue}`)
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.placeholder && args.placeholder !== 'Enter amount') options.push(`placeholder: '${args.placeholder}'`)
  if (args.currency && args.currency !== 'USD') options.push(`currency: '${args.currency}'`)
  if (args.showCurrencyCode) options.push('showCurrencyCode: true')
  if (args.hideSymbolWhenEmpty === false) options.push('hideSymbolWhenEmpty: false')
  
  const formProps: string[] = []
  if (args.formReadOnly) formProps.push('readOnly={true}')
  if (args.formReadOnlyStyle !== 'value') formProps.push(`readOnlyStyle="${args.formReadOnlyStyle}"`)
  
  const optionsString = options.length > 0 ? `
        ${options.join(',\n        ')},` : ''
  
  const formPropsString = formProps.length > 0 ? `\n  ${formProps.join('\n  ')}` : ''
  
  const code = `<Form
  id="example-form"${formPropsString}
  fields={[
    {
      key: 'price',
      type: FormFieldType.Currency,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
  
  codeCache.set(cacheKey, code)
  return code
}

interface MoneyFieldStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: number | undefined
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  placeholder: string
  currency: CurrencyCode
  showCurrencyCode: boolean
  hideSymbolWhenEmpty: boolean
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The MoneyField component is specifically designed for capturing currency amounts.
 * It supports multiple international currencies with proper symbols, positioning,
 * and formatting. Features a dynamic currency symbol that appears when the field 
 * has content and automatically adjusts input padding for optimal user experience.
 */
const meta: Meta<MoneyFieldStoryArgs> = {
  title: 'Forms/MoneyField',
  tags: ['autodocs'],
  parameters: {
    docs: {
      source: {
        type: 'code',
        transform: (code: string, storyContext: any) => {
          return generateMoneyFieldCode(storyContext.args)
        },
      },
      story: {
        inline: true,
        autoplay: false,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { control: 'number', description: 'Default monetary value' },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    currency: {
      control: 'select',
      options: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'INR', 'KRW', 'CNY', 'BRL', 'MXN', 'RUB', 'TRY'],
      description: 'Currency to use',
    },
    showCurrencyCode: { control: 'boolean', description: 'Show currency code alongside symbol' },
    hideSymbolWhenEmpty: { control: 'boolean', description: 'Hide symbol when field is empty' },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
  args: {
    label: 'Amount',
    required: false,
    disabled: false,
    defaultValue: undefined,
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please enter a valid amount.',
    placeholder: 'Enter amount',
    currency: 'USD',
    showCurrencyCode: false,
    hideSymbolWhenEmpty: true,
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    const field: { key: string; type: FormFieldType.Currency; options: CurrencyFieldOptions } = {
      key: 'storybookMoneyField',
      type: FormFieldType.Currency,
      options: {
        label: args.label,
        required: args.required,
        disabled: args.disabled,
        defaultValue: args.defaultValue,
        // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
        ...(args.readOnly && { readOnly: args.readOnly }),
        ...(args.readOnly && args.readOnlyStyle !== 'value' && { readOnlyStyle: args.readOnlyStyle }),
        placeholder: args.placeholder,
        currency: args.currency,
        showCurrencyCode: args.showCurrencyCode,
        hideSymbolWhenEmpty: args.hideSymbolWhenEmpty,
      },
    }
    return (
      <StorybookFieldWrapper
        field={field}
        hasError={args.hasError}
        errorMessage={args.errorMessage}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
        showState={args.showState}
      />
    )
  },
}
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default State (USD)',
  args: { showState: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('spinbutton')
    await expect(input).toBeInTheDocument()
    await expect(input).toHaveAttribute('type', 'number')
    await expect(input).toHaveAttribute('step', '0.01')
    await expect(input).toBeEnabled()
  },
}

export const Euro: Story = {
  name: 'Euro Currency',
  args: { 
    currency: 'EUR',
    defaultValue: 99.99,
    label: 'Price (EUR)',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByDisplayValue('99.99')
    await expect(input).toBeInTheDocument()
    
    // Euro symbol should be visible
    const euroSymbol = await canvas.findByText('€')
    await expect(euroSymbol).toBeInTheDocument()
  },
}

export const BritishPound: Story = {
  name: 'British Pound',
  args: { 
    currency: 'GBP',
    defaultValue: 75.50,
    label: 'Price (GBP)',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByDisplayValue('75.5')
    await expect(input).toBeInTheDocument()
    
    // Pound symbol should be visible
    const poundSymbol = await canvas.findByText('£')
    await expect(poundSymbol).toBeInTheDocument()
  },
}

export const JapaneseYen: Story = {
  name: 'Japanese Yen (No Decimals)',
  args: { 
    currency: 'JPY',
    defaultValue: 1500,
    label: 'Price (JPY)',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByDisplayValue('1500')
    await expect(input).toBeInTheDocument()
    await expect(input).toHaveAttribute('step', '1') // No decimals for JPY
    
    // Yen symbol should be visible
    const yenSymbol = await canvas.findByText('¥')
    await expect(yenSymbol).toBeInTheDocument()
  },
}

export const SwedishKrona: Story = {
  name: 'Swedish Krona (Symbol After)',
  args: { 
    currency: 'SEK',
    defaultValue: 250.00,
    label: 'Price (SEK)',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByDisplayValue('250')
    await expect(input).toBeInTheDocument()
    
    // Krona symbol should be visible and positioned after
    const kronaSymbol = await canvas.findByText('kr')
    await expect(kronaSymbol).toBeInTheDocument()
  },
}

export const WithCurrencyCode: Story = {
  name: 'With Currency Code Display',
  args: { 
    currency: 'CAD',
    defaultValue: 125.99,
    showCurrencyCode: true,
    label: 'Price with Code',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByDisplayValue('125.99')
    await expect(input).toBeInTheDocument()
    
    // Both symbol and code should be visible
    const cadSymbol = await canvas.findByText('C$')
    await expect(cadSymbol).toBeInTheDocument()
    const cadCode = await canvas.findByText('CAD')
    await expect(cadCode).toBeInTheDocument()
  },
}

export const AlwaysShowSymbol: Story = {
  name: 'Always Show Symbol',
  args: { 
    currency: 'USD',
    hideSymbolWhenEmpty: false,
    label: 'Always Show $',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('spinbutton')
    
    // Dollar sign should be visible even when empty
    const dollarSign = await canvas.findByText('$')
    await expect(dollarSign).toBeInTheDocument()
    
    // Test typing
    await userEvent.type(input, '42.50')
    await expect(input).toHaveValue(42.5)
  },
}

export const CurrencySymbolInteraction: Story = {
  name: 'Currency Symbol Interaction',
  args: { 
    currency: 'EUR',
    label: 'Price',
    placeholder: '0.00',
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('spinbutton')
    
    // Start typing - euro symbol should appear
    await userEvent.type(input, '1')
    await expect(input).toHaveValue(1)
    
    // Continue typing
    await userEvent.type(input, '23.45')
    await expect(input).toHaveValue(123.45)
    
    // Clear the field - euro symbol should hide
    await userEvent.clear(input)
    await expect(input).toHaveValue(null)
  },
}

export const ReadOnlyValue: Story = {
  name: 'Read-Only (Value Style)',
  args: { 
    readOnly: true,
    currency: 'EUR',
    defaultValue: 299.99,
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should render as formatted currency value
    const valueDisplay = await canvas.findByText('€299,99') // Euro formatting
    await expect(valueDisplay).toBeInTheDocument()
    
    // Should not have an input field
    const inputs = canvas.queryAllByRole('spinbutton')
    await expect(inputs).toHaveLength(0)
  },
}

export const ReadOnlyWithCode: Story = {
  name: 'Read-Only with Currency Code',
  args: { 
    readOnly: true,
    currency: 'GBP',
    defaultValue: 150.75,
    showCurrencyCode: true,
    showState: false 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Should render as formatted currency value with code
    const valueDisplay = await canvas.findByText('£150.75 GBP')
    await expect(valueDisplay).toBeInTheDocument()
  },
}

export const MultiCurrencyComparison: Story = {
  name: 'Multi-Currency Showcase',
  args: { 
    currency: 'USD',
    defaultValue: 100,
    label: 'Select Currency Above',
    showState: false 
  },
  parameters: {
    docs: {
      source: {
        code: `// Showcase of different currencies
const currencies = [
  { currency: 'USD', symbol: '$', position: 'before' },
  { currency: 'EUR', symbol: '€', position: 'before' },
  { currency: 'GBP', symbol: '£', position: 'before' },
  { currency: 'JPY', symbol: '¥', position: 'before', decimals: 0 },
  { currency: 'SEK', symbol: 'kr', position: 'after' },
  { currency: 'PLN', symbol: 'zł', position: 'after' },
]

<Form
  fields={currencies.map(curr => ({
    key: curr.currency.toLowerCase(),
    type: FormFieldType.Currency,
    options: {
      label: \`Price (\${curr.currency})\`,
      currency: curr.currency,
      defaultValue: 100,
    },
  }))}
  submit={(values) => console.log(values)}
/>`,
      },
    },
  },
}

export const InteractiveExample: Story = {
  name: 'Interactive Example',
  args: { 
    label: 'Product Price',
    placeholder: '0.00',
    currency: 'USD',
    required: true,
    showState: true 
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole('spinbutton')
    
    // Test typing decimal values
    await userEvent.type(input, '19.99')
    await expect(input).toHaveValue(19.99)
    
    // Clear and test whole numbers
    await userEvent.clear(input)
    await userEvent.type(input, '50')
    await expect(input).toHaveValue(50)
    
    // Test large amounts
    await userEvent.clear(input)
    await userEvent.type(input, '1234.56')
    await expect(input).toHaveValue(1234.56)
  },
} 