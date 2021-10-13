module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 12
  },
  ignorePatterns: [ 'node_modules/*' ],
  extends: 'eslint:recommended',
  rules: {
    'object-curly-spacing': [ 'error', 'always' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'semi-spacing': [ 'error', { 'before': false, 'after': true } ],
    'space-in-parens': [ 'error', 'always' ],
    'space-before-blocks': 'error',
    'space-infix-ops': 'error',
    'comma-dangle': [ 'error', 'never' ],
    'no-console': [ 'warn', { allow: [ 'warn', 'error' ] } ],
    'space-unary-ops': 'error',
    'no-var': 'error',
    'no-alert': 'error',
    'no-param-reassign': 'warn',
    semi: [ 'error', 'never' ],
    quotes: [ 'error', 'single' ],
    eqeqeq: 'warn'
  }
}
