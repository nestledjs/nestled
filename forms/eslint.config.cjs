const nx = require('@nx/eslint-plugin')
const baseConfig = require('../eslint.config.js')

module.exports = [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    // Ignore build outputs and generated files
    ignores: [
      'storybook-static/**',
      'dist/**', 
      'coverage/**',
      '**/node_modules/**',
      'src/markdown.ts'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here - make forms project very permissive
    rules: {
      // Disable common warnings for this working codebase
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'storybook/no-redundant-story-name': 'off',
      'react-hooks/exhaustive-deps': 'off',
      // Allow other common patterns
      '@typescript-eslint/no-empty-function': 'off',
      'prefer-const': 'off',
      'no-var': 'off'
    },
  },
]
