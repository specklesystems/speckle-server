import { omit } from 'lodash-es'
import { baseConfigs, globals, getESMDirname } from '../../eslint.config.mjs'
import withNuxt from './.nuxt/eslint.config.mjs'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

const configs = await withNuxt([
  {
    rules: {
      camelcase: [
        'error',
        {
          properties: 'always',
          allow: ['^[\\w]+_[\\w]+Fragment$']
        }
      ],
      'no-alert': 'error',
      eqeqeq: ['error', 'always', { null: 'always' }],
      'no-console': 'off',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.{ts,vue,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        extraFileExtensions: ['.vue'],
        tsconfigRootDir: getESMDirname(import.meta.url)
      }
    }
  },
  {
    files: ['**/*.test.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  {
    files: ['./{components|pages|store|lib}/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser
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
      '@typescript-eslint/restrict-plus-operands': ['error'],
      '@typescript-eslint/await-thenable': ['warn'],
      '@typescript-eslint/ban-types': ['warn'],
      'require-await': 'off',
      '@typescript-eslint/require-await': 'error',
      'no-undef': 'off',

      '@typescript-eslint/unified-signatures': 'off', // DX sucks in vue event definitions
      '@typescript-eslint/no-dynamic-delete': 'off', // too restrictive
      '@typescript-eslint/restrict-template-expressions': 'off', // too restrictive
      '@typescript-eslint/no-invalid-void-type': 'off' // too restrictive
    }
  },
  ...pluginVueA11y.configs['flat/recommended'].map((c) => ({
    ...c,
    files: [...(c.files || []), '**/*.vue'],
    languageOptions: c.languageOptions
      ? omit(c.languageOptions, ['parserOptions', 'parser']) // Prevent overriding parser
      : undefined
  })),
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
      ],
      'vue/html-self-closing': 'off' // messes with prettier
    }
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-var': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off'
    }
  }
]).prepend([
  {
    ignores: [
      '**/node_modules/**',
      '**/templates/*',
      './lib/common/generated/**/*',
      'storybook-static',
      '.nuxt/**',
      '.output/**'
    ]
  },
  ...baseConfigs
])

export default configs
