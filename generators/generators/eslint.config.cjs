const tsParser = require('@typescript-eslint/parser')
const jsonParser = require('jsonc-eslint-parser')
const path = require('path')

module.exports = [
  {
    files: ['**/*.ts', '**/*.js'],
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
    files: ['**/*.json'],
    languageOptions: {
      parser: jsonParser,
    },
    rules: {
      '@nx/dependency-checks': 'off',
    },
  },
]
