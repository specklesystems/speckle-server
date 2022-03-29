/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  env: {
    es2021: true,
    node: true,
    commonjs: true
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    camelcase: [
      1,
      {
        properties: 'always'
      }
    ],
    'no-var': 'error',
    'no-alert': 'error',
    eqeqeq: 'warn'
  },
  ignorePatterns: ['node_modules', 'dist', 'public']
}

module.exports = config
