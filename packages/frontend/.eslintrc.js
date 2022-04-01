/* eslint-env node */

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
  ignorePatterns: ['nginx'],
  // Specifying full "extends" value from base config to change order
  extends: ['plugin:vue/recommended', 'eslint:recommended', 'prettier'],
  parserOptions: {
    sourceType: 'module'
  },
  overrides: [
    {
      files: './*.{js, ts}',
      env: {
        node: true,
        commonjs: true
      }
    }
  ],
  plugins: ['vue']
}

module.exports = config
