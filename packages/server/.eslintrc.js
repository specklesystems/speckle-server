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
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      parserOptions: {
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        parser: '@typescript-eslint/parser'
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-return': 'error'
      }
    },
    {
      files: '*.d.ts',
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      files: '*.spec.{js,ts}',
      env: {
        mocha: true
      },
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    },
    {
      files: '**/graph/resolvers/**/*.{js,ts}',
      rules: {
        // so that we're able to mark userId as non-optional in relevant GQL resolvers
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    }
  ]
}

module.exports = config
