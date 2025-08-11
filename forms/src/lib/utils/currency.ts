import { CurrencyCode, CurrencyConfig } from '../form-types'

// Comprehensive currency configurations
export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.',
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Złoty',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: 'Czech Koruna',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    name: 'Hungarian Forint',
    symbolPosition: 'after',
    decimalPlaces: 0,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  RON: {
    code: 'RON',
    symbol: 'lei',
    name: 'Romanian Leu',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  BGN: {
    code: 'BGN',
    symbol: 'лв',
    name: 'Bulgarian Lev',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  HRK: {
    code: 'HRK',
    symbol: 'kn',
    name: 'Croatian Kuna',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  HKD: {
    code: 'HKD',
    symbol: 'HK$',
    name: 'Hong Kong Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  PHP: {
    code: 'PHP',
    symbol: '₱',
    name: 'Philippine Peso',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  VND: {
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    symbolPosition: 'after',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
}

/**
 * Get currency configuration by code
 */
export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return CURRENCY_CONFIGS[code]
}

/**
 * Get all available currencies as options for select fields
 */
export function getCurrencyOptions() {
  return Object.values(CURRENCY_CONFIGS).map((config) => ({
    value: config.code,
    label: `${config.symbol} ${config.code} - ${config.name}`,
  }))
}

/**
 * Get popular currencies as options (most commonly used globally)
 */
export function getPopularCurrencyOptions() {
  const popularCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY']
  return popularCurrencies.map((code) => ({
    value: code,
    label: `${CURRENCY_CONFIGS[code].symbol} ${code} - ${CURRENCY_CONFIGS[code].name}`,
  }))
}

/**
 * Group digits in the integer part with a thousands separator without using regex.
 * This avoids potential super-linear backtracking issues in complex regexes.
 */
function groupThousands(intPart: string, separator: string): string {
  const isNegative = intPart.startsWith('-')
  let digits = isNegative ? intPart.slice(1) : intPart
  if (digits.length <= 3 || separator === '') {
    return isNegative ? '-' + digits : digits
  }

  let output = ''
  for (let i = digits.length; i > 3; i -= 3) {
    output = separator + digits.slice(i - 3, i) + output
  }
  const headLength = digits.length % 3 || 3
  const result = digits.slice(0, headLength) + output
  return isNegative ? '-' + result : result
}

/**
 * Format a number as currency based on currency configuration
 */
export function formatCurrency(
  value: number | string | null | undefined,
  config: CurrencyConfig,
  options: {
    showSymbol?: boolean
    showCode?: boolean
    includeDecimals?: boolean
  } = {},
): string {
  const { showSymbol = true, showCode = false, includeDecimals = true } = options

  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) {
    return ''
  }

  // Format the number with proper decimal places
  const decimalPlaces = includeDecimals ? config.decimalPlaces : 0
  const formattedNumber = numValue.toFixed(decimalPlaces)

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = formattedNumber.split('.')

  // Add 'thousands' separators
  const formattedInteger = groupThousands(integerPart, config.thousandsSeparator)

  // Combine with a decimal separator if needed
  const formattedValue = decimalPart ? `${formattedInteger}${config.decimalSeparator}${decimalPart}` : formattedInteger

  // Build the final string
  let result = formattedValue

  if (showSymbol) {
    if (config.symbolPosition === 'before') {
      result = `${config.symbol}${result}`
    } else {
      result = `${result} ${config.symbol}`
    }
  }

  if (showCode) {
    result = `${result} ${config.code}`
  }

  return result
}

/**
 * Parse a formatted currency string back to a number
 */
export function parseCurrency(value: string, config: CurrencyConfig): number | null {
  if (!value || typeof value !== 'string') {
    return null
  }

  // Remove currency symbol and code
  let cleanValue = value.replace(config.symbol, '').replace(config.code, '').trim()

  // Replace thousands separators
  cleanValue = cleanValue.replace(new RegExp(`\\${config.thousandsSeparator}`, 'g'), '')

  // Replace decimal separator with standard dot
  if (config.decimalSeparator !== '.') {
    cleanValue = cleanValue.replace(config.decimalSeparator, '.')
  }

  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? null : parsed
}

/**
 * Get the appropriate step value for HTML input based on currency
 */
export function getCurrencyStep(config: CurrencyConfig): string {
  if (config.decimalPlaces === 0) {
    return '1'
  }
  return `0.${'0'.repeat(config.decimalPlaces - 1)}1`
}

/**
 * Resolve the final currency configuration from options
 */
export function resolveCurrencyConfig(
  currency: CurrencyCode | 'custom' = 'USD',
  customCurrency?: Partial<CurrencyConfig>,
): CurrencyConfig {
  if (currency === 'custom' && customCurrency) {
    // Merge custom config with USD defaults
    return {
      ...CURRENCY_CONFIGS.USD,
      ...customCurrency,
      code: customCurrency.code || 'USD',
    }
  }

  return CURRENCY_CONFIGS[currency as CurrencyCode] || CURRENCY_CONFIGS.USD
}

/**
 * Validate if a currency code is supported
 */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in CURRENCY_CONFIGS
}

/**
 * Convert between currencies (requires exchange rates - this is a placeholder)
 * In a real application, you would integrate with a currency API
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates?: Record<string, number>,
): number {
  // This is a simplified example - in practice you'd use real exchange rates
  if (fromCurrency === toCurrency) {
    return amount
  }

  if (!exchangeRates) {
    throw new Error('Exchange rates required for currency conversion')
  }

  const rate = exchangeRates[`${fromCurrency}_${toCurrency}`]
  if (!rate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`)
  }

  return amount * rate
}

/**
 * Format currency for display in different contexts
 */
export function formatCurrencyForDisplay(
  value: number | string | null | undefined,
  currency: CurrencyCode,
  context: 'input' | 'display' | 'compact' = 'display',
): string {
  const config = getCurrencyConfig(currency)

  switch (context) {
    case 'input': {
      // For input fields - no thousands separators, standard decimal
      return formatCurrency(value, { ...config, thousandsSeparator: '' }, { showSymbol: false })
    }

    case 'compact': {
      // For compact display - abbreviated large numbers
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (numValue && numValue >= 1000000) {
        return formatCurrency(numValue / 1000000, config, { includeDecimals: false }) + 'M'
      } else if (numValue && numValue >= 1000) {
        return formatCurrency(numValue / 1000, config, { includeDecimals: false }) + 'K'
      }
      return formatCurrency(value, config)
    }

    case 'display':
    default: {
      // Standard display format
      return formatCurrency(value, config)
    }
  }
}
