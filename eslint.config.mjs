import globals from 'globals'
import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

/**
 * TODO:
 * - Check speed (inspect ignored files, that we're not processing junk)
 * - Fix lint-staged
 */

/**
 * Feed in import.meta.url in your .mjs module to get the equivalent of __dirname
 * @param {string} importMetaUrl
 */
export const getESMDirname = (importMetaUrl) => {
  return dirname(fileURLToPath(importMetaUrl))
}

/**
 * Configs that should only apply to repo root (shouldn't be inherited in subdirectories)
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const rootConfigs = [
  {
    ignores: [
      'packages/**/*',
      '.circleci',
      '.devcontainer',
      '.github',
      '.husky',
      '.vscode',
      '.yarn',
      'docker',
      'node_modules',
      'test-queries',
      'setup'
    ]
  },
  {
    files: ['*.{js,mjs,cjs}', '.*.{js,mjs,cjs}', 'utils/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['*.mjs', '.*.mjs', 'utils/*.mjs'],
    languageOptions: {
      sourceType: 'module'
    }
  }
]

/**
 * Base configs that should be inherited in all packages as well
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
export const baseConfigs = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-*/**',
      '**/public/**',
      '**/events.json',
      '**/generated/**/*',
      '**/.nuxt/**',
      '**/.output/**'
    ]
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module'
    }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs'
    }
  },
  {
    files: ['**/*.{js,mjs,cjs}', '**/.*.{js,mjs,cjs}'],
    ...js.configs.recommended
  },
  prettierConfig,
  {
    rules: {
      camelcase: [
        1,
        {
          properties: 'always'
        }
      ],
      'no-var': 'error',
      'no-alert': 'error',
      eqeqeq: 'error',
      'prefer-const': 'warn',
      'object-shorthand': 'warn'
    }
  }
]

const configs = [...baseConfigs, ...rootConfigs]

export { globals, prettierConfig }
export default configs
