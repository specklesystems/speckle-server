import tseslint from 'typescript-eslint'
import {
  baseConfigs,
  getESMDirname,
  globals,
  prettierConfig
} from '../../eslint.config.mjs'

const configs = [
  ...baseConfigs,
  {
    ignores: ['dist', 'public', 'docs']
  },
  {
    files: ['webpack.config.renderPage.cjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.js'],
    ignores: ['renderPage', '**/*.mjs', 'src/scripts/puppeteerDriver.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['bin/www'],
    languageOptions: {
      sourceType: 'module',
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
    files: ['src/scripts/puppeteerDriver.js'],
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
