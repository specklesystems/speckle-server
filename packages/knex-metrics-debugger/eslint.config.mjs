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
    ignores: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  }
]

export default configs
