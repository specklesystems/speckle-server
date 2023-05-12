const mainExtends = ['eslint:recommended', 'prettier']

/** @type {import("eslint").Linter.Config} */
const config = {
  env: {
    node: true
  },
  extends: [...mainExtends],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
}

module.exports = config
