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
    eqeqeq: 'error',
    'prefer-const': 'warn',
    'object-shorthand': 'warn'
  },
  ignorePatterns: ['node_modules', 'dist', 'public', 'events.json', '.mocharc.js']
}

module.exports = config
