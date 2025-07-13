const nx = require('@nx/eslint-plugin')
const baseConfig = require('../eslint.config.js')

module.exports = [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.md/*.ts', '**/*.md/*.tsx'], // This is how eslint-plugin-markdown extracts fenced blocks
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  }
]
