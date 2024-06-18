import { baseConfigs, globals, getESMDirname } from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'

/**
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module'
    }
  },
  {
    files: ['*.{js,cjs,mjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.src'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: [...(c.files || []), '**/*.ts', '**/*.d.ts']
  })),
  {
    files: ['**/*.ts', '**/*.d.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: getESMDirname(import.meta.url),
        project: './tsconfig.json'
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-base-to-string': 'off', // too restrictive
      '@typescript-eslint/restrict-template-expressions': 'off', // too restrictive
      '@typescript-eslint/no-unsafe-enum-comparison': 'off', // too restrictive
      '@typescript-eslint/require-await': 'off', // too restrictive
      '@typescript-eslint/unbound-method': 'off', // too restrictive
      '@typescript-eslint/no-misused-promises': 'off'
    }
  },
  {
    rules: {
      'no-console': 'off'
    }
  }
]

export default configs
