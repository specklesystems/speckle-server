import {
  baseConfigs,
  globals,
  prettierConfig,
  getESMDirname
} from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'

const configs = [
  ...baseConfigs,
  {
    ignores: ['dist', 'public', 'docs']
  },
  {
    files: ['**/*.js', 'bin/www'],
    ignores: ['renderPage', '**/*.mjs', 'scripts/puppeteerDriver.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['renderPage/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ['scripts/puppeteerDriver.js'],
    languageOptions: {
      sourceType: 'commonjs',
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
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-return': 'error'
    }
  },
  {
    files: ['**/*.spec.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  prettierConfig
]

export default configs
