import { baseConfigs, globals } from '../../eslint.config.mjs'

/**
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    ignores: ['examples', 'types']
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ['*.{js,mjs,ts,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
]

export default configs
