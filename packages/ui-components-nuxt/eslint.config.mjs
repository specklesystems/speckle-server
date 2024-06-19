import { baseConfigs, globals } from '../../eslint.config.mjs'

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
  }
]

export default configs
