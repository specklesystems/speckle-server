// eslint-disable-next-line no-undef
module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es2021': true
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module'
  },
  'ignorePatterns': [ 'node_modules/*' ],
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'arrow-spacing': [
      2,
      {
        'before': true,
        'after': true
      }
    ],
    'array-bracket-spacing': [ 2, 'always' ],
    'object-curly-spacing': [ 1, 'always' ],
    'block-spacing': [ 2, 'always' ],
    'space-in-parens': [ 2, 'always' ],
    'keyword-spacing': 2,
    'space-unary-ops': [
      2,
      {
        'words': true,
        'nonwords': false
      }
    ]
  }
}
