const tsParser = require('@typescript-eslint/parser')
const jsonParser = require('jsonc-eslint-parser')
const path = require('path')

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: [path.resolve(__dirname, './tsconfig.lib.json')],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@nx/dependency-checks': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: [path.resolve(__dirname, './tsconfig.spec.json')],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@nx/dependency-checks': 'off',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@nx/dependency-checks': 'off',
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsonParser,
    },
    rules: {
      '@nx/dependency-checks': 'off',
    },
  },
]
