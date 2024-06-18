import {
  baseConfigs,
  globals,
  prettierConfig,
  getESMDirname
} from '../../eslint.config.mjs'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

const tsParserOptions = {
  tsconfigRootDir: getESMDirname(import.meta.url),
  project: './tsconfig.eslint.json',
  extraFileExtensions: ['.vue']
}

/**
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    ignores: ['nginx/**', 'generated/**/*']
  },
  {
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ['*.js'],
    ignores: ['vite.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node
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
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // Vue
  ...pluginVue.configs['flat/vue2-recommended'].map((c) => ({
    ...c,
    files: [...(c.files || []), '**/*.vue']
  })),
  {
    files: ['**/*.vue'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'vue/component-name-in-template-casing': ['warn', 'kebab-case'],
      'vue/require-default-prop': 'off',

      // TODO: Can we clean some of these up?
      // There was a lot of `any` magic in FE1, would take a lot of effort to clean those up
      '@typescript-eslint/no-unsafe-call': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-member-access': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-assignment': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-argument': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/no-unsafe-return': 'off' // can be turned on, but there's a lot of fixing to do
    },
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ...tsParserOptions
      }
    }
  },
  // Vue + TS
  {
    files: ['**/*.vue', '**/*.ts', '**/*.d.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off', // too many false positives
      '@typescript-eslint/restrict-template-expressions': 'off', // too restrictive
      '@typescript-eslint/no-this-alias': 'off', // who cares lol
      '@typescript-eslint/no-misused-promises': 'off', // too restrictive
      '@typescript-eslint/no-implied-eval': 'off', // false positives cause of any
      '@typescript-eslint/no-unsafe-enum-comparison': 'off', // too restrictive

      '@typescript-eslint/no-floating-promises': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/require-await': 'off', // can be turned on, but there's a lot of fixing to do
      '@typescript-eslint/await-thenable': 'off' // can be turned on, but there's a lot of fixing to do
    }
  },
  {
    files: ['./*.{js,ts}', './build-config/**/*.{js, ts}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs
      }
    }
  },
  prettierConfig
]

export default configs
