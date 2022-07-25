/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

/**
 * Extends repo root config, only put changes here that are scoped to this specific package
 * (if you already are - evaluate whether you really need package scoped linting rules)
 */

/** @type {import("eslint").Linter.Config} */
const config = {
  env: {
    browser: true,
    node: false,
    commonjs: false
  },
  ignorePatterns: ['nginx', 'generated/**/*'],
  // Specifying full "extends" value from base config to change order
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    sourceType: 'module'
  },
  overrides: [
    {
      files: '*.vue',
      plugins: ['vue'],
      extends: ['plugin:vue/recommended', '@vue/eslint-config-typescript', 'prettier'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error']
      }
    },
    {
      files: './*.{js, ts}',
      env: {
        node: true,
        commonjs: true
      }
    },
    {
      files: './build-config/**/*.{js, ts}',
      env: {
        node: true,
        commonjs: true
      }
    },
    {
      files: '*.ts',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
      ],
      parser: '@typescript-eslint/parser'
    },
    {
      files: '*.d.ts',
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}

module.exports = config
