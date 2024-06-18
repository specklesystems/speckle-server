import {
  baseConfigs,
  globals,
  getESMDirname,
  prettierConfig
} from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import { omit } from 'lodash-es'

const tsParserOptions = {
  tsconfigRootDir: getESMDirname(import.meta.url),
  project: ['./tsconfig.json', './tsconfig.node.json'],
  extraFileExtensions: ['.vue']
}

/**
 * Base configs that should be inherited in all packages as well
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    ignores: ['storybook-static', 'utils/tailwind-configure.d.ts']
  },
  {
    rules: {
      'no-alert': 'error',
      eqeqeq: ['error', 'always', { null: 'always' }],
      'no-console': 'off',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module'
    }
  },
  {
    files: ['*.test.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  {
    files: ['./src/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  // TS
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: [...(c.files || []), '**/*.ts', '**/*.d.ts', '**/*.vue']
  })),
  {
    files: ['**/*.ts', '**/*.d.ts'],
    languageOptions: {
      parserOptions: {
        ...tsParserOptions
      }
    }
  },

  ...pluginVue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: [...(config.files || []), '**/*.vue']
  })),
  ...pluginVueA11y.configs['flat/recommended'].map((c) => ({
    ...c,
    files: [...(c.files || []), '**/*.vue'],
    languageOptions: c.languageOptions
      ? omit(c.languageOptions, ['parserOptions', 'parser', 'globals']) // Prevent overriding parser & globals
      : undefined
  })),
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ...tsParserOptions
      }
    }
  },
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      '@typescript-eslint/no-explicit-any': ['error'],
      '@typescript-eslint/no-unsafe-argument': ['error'],
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-for-in-array': ['error'],
      '@typescript-eslint/restrict-template-expressions': ['error'],
      '@typescript-eslint/restrict-plus-operands': ['error'],
      '@typescript-eslint/await-thenable': ['warn'],
      '@typescript-eslint/ban-types': ['warn'],
      'require-await': 'off',
      '@typescript-eslint/require-await': 'error',
      'no-undef': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off' // too restrictive
    }
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/component-tags-order': [
        'error',
        { order: ['docs', 'template', 'script', 'style'] }
      ],
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: false }
      ],
      'vuejs-accessibility/label-has-for': [
        'error',
        {
          required: {
            some: ['nesting', 'id']
          }
        }
      ]
    }
  },
  {
    files: ['**/*.stories.{js,ts}'],
    rules: {
      // storybook types suck and can't be augmented
      '@typescript-eslint/no-unsafe-call': 'off'
    }
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-var': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off'
    }
  },
  prettierConfig
]

export default configs
