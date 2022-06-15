const path = require('path')

/**
 * Extends repo root config, only put changes here that are scoped to this specific package
 * (if you're already are - evaluate whether you really need package scoped linting rules)
 */

/** @type {import("eslint").Linter.Config} */
const config = {
  env: {
    browser: true
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
    babelOptions: {
      configFile: path.resolve(__dirname, './babel.config.js')
    }
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  ignorePatterns: ['dist2', 'example/speckleviewer.web.js'],
  overrides: [
    {
      files: '*.ts',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
      ],
      parser: '@typescript-eslint/parser'
    }
  ]
}

module.exports = config
