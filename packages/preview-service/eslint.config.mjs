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
    ignores: ['render_page', '**/*.mjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['render_page/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  }
]

export default configs
