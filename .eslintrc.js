/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  parserOptions: {
    ecmaVersion: 2022
  },
  env: {
    es2022: true,
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
  overrides: [
    {
      files: '*.mjs',
      parserOptions: {
        sourceType: 'module'
      }
    }
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'dist-*',
    'public',
    'events.json',
    '.*.{ts,js,vue,tsx,jsx}',
    'generated/**/*',
    '.nuxt',
    '.output',
    'utils/helm/**/*',
    'utils/1_click_image_scripts/**/*',
    'setup/**/*',
    'test-queries/**/*',
    '*-data/**/*',
    '.yarn/**/*',
    '.vscode/**/*',
    '.circleci/**/*',
    '.github/**/*',
    '.husky/**/*',
    '.yarn/**/*'
  ]
}

module.exports = config
