import { baseConfigs, globals } from '../../eslint.config.mjs'

/**
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    ignores: ['public', 'docs']
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
  }
]

export default configs
