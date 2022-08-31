/**
 * Extends repo root config, only put changes here that are scoped to this specific package
 * (if you already are - evaluate whether you really need package scoped linting rules)
 */

/** @type {import("eslint").Linter.Config} */
const config = {
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 13
  },
  ignorePatterns: ['node_modules', 'dist', 'generated/**/*'],
  overrides: [
    {
      files: '*.ts',
      plugins: ['@typescript-eslint'],
      parserOptions: {
        sourceType: 'module'
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
      ],
      parser: '@typescript-eslint/parser'
    },
    {
      files: '*.spec.{js,ts}',
      env: {
        mocha: true
      },
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    }
  ]
}

module.exports = config
