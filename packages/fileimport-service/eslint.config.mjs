import { baseConfigs, globals } from '../../eslint.config.mjs'

/**
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    ignores: ['**/ifc/**', '**/obj/**', '**/stl/**']
  },
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
]

export default configs
