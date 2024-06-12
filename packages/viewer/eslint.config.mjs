import path from 'path'
import { baseConfigs, globals, getESMDirname } from '../../eslint.config.mjs'
import * as babelParser from '@babel/eslint-parser'
import tseslint from 'typescript-eslint'

const __dirname = getESMDirname(import.meta.url)
const babelConfigFile = path.resolve(__dirname, './.babelrc')

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
    languageOptions: {
      globals: {
        ...globals.browser
      },
      parser: babelParser,
      parserOptions: {
        babelOptions: {
          configFile: babelConfigFile
        }
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
        project: './tsconfig.eslint.json'
      }
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-base-to-string': 'off', // too restrictive
      '@typescript-eslint/restrict-template-expressions': 'off', // too restrictive
      '@typescript-eslint/no-unsafe-enum-comparison': 'off', // too restrictive
      '@typescript-eslint/require-await': 'off', // too restrictive
      '@typescript-eslint/unbound-method': 'off', // too restrictive

      // TODO: Can we re-enable these? Only disabled because of the amount of errors
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
]

export default configs
