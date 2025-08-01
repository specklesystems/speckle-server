import {
  baseConfigs,
  globals,
  prettierConfig,
  getESMDirname
} from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'

/**
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.cjs', '**/*.cts'],
    languageOptions: {
      sourceType: 'commonjs'
    }
  },
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: [...(c.files || []), '**/*.ts', '**/*.d.ts', '**/*.cts']
  })),
  {
    files: ['**/*.ts', '**/*.d.ts', '**/*.cts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: getESMDirname(import.meta.url),
        project: './tsconfig.json'
      }
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['.*']
        }
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-misused-promises': 'off', // breaks async middlewares (could be fixed tho)
      '@typescript-eslint/restrict-template-expressions': 'off', // too restrictive
      '@typescript-eslint/no-unsafe-enum-comparison': 'off', // too restrictive
      '@typescript-eslint/unbound-method': 'off', // too many false positives
      '@typescript-eslint/no-unnecessary-type-assertion': 'off', // false positives - sometimes they are actually necessary
      '@typescript-eslint/no-empty-object-type': 'off', // too restrictive
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: ['AssertionError']
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: 'Schema$'
        }
      ],

      // Until we fully move to ESM, we can't have this:
      '@typescript-eslint/no-require-imports': 'off',

      // TODO: Enable these
      '@typescript-eslint/require-await': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/await-thenable': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-call': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-member-access': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-assignment': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-argument': 'off' // can be turned on, but there's a lot of fixing to do
    }
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['**/*.spec.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },
  {
    files: ['**/graph/resolvers/**/*.{js,ts}'],
    rules: {
      // so that we're able to mark userId as non-optional in relevant GQL resolvers
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },
  {
    files: ['**/*.spec.ts', '**/tests/**/*.{js,ts}', 'test/**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  },
  prettierConfig
]

export default configs
