const mainExtends = [
  'plugin:nuxt/recommended',
  'plugin:vue/vue3-recommended',
  // 'plugin:storybook/recommended',
  'prettier'
]

/** @type {import('eslint').Linter.Config} */
const config = {
  env: {
    node: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json'],
    extraFileExtensions: ['.vue']
  },
  extends: [...mainExtends],
  plugins: ['@typescript-eslint'],
  ignorePatterns: [
    '**/templates/*',
    'coverage',
    'lib/common/generated/**/*',
    'storybook-static',
    '!.storybook',
    '.nuxt',
    '.output'
  ],
  rules: {
    camelcase: [
      'error',
      {
        properties: 'always',
        allow: ['^[\\w]+_[\\w]+Fragment$']
      }
    ],
    'no-alert': 'error',
    eqeqeq: ['error', 'always', { null: 'always' }],
    'no-console': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: '*.test.{ts,js}',
      env: {
        jest: true
      }
    },
    {
      files: './{components|pages|store|lib}/*.{js,ts,vue}',
      env: {
        node: false,
        browser: true
      }
    },
    {
      files: '*.{ts,tsx,vue}',
      extends: ['plugin:@typescript-eslint/recommended', ...mainExtends],
      rules: {
        '@typescript-eslint/no-explicit-any': ['error'],
        '@typescript-eslint/no-unsafe-argument': ['error'],
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-for-in-array': ['error'],
        '@typescript-eslint/restrict-template-expressions': ['error'],
        '@typescript-eslint/restrict-plus-operands': ['error'],
        '@typescript-eslint/await-thenable': ['warn'],
        '@typescript-eslint/ban-types': ['warn'],
        'require-await': 'off',
        '@typescript-eslint/require-await': 'error',
        'no-undef': 'off'
      }
    },
    {
      files: '*.vue',
      plugins: ['vuejs-accessibility'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        ...mainExtends,
        'plugin:vuejs-accessibility/recommended'
      ],
      rules: {
        'vue/component-tags-order': [
          'error',
          { order: ['docs', 'template', 'script', 'style'] }
        ],
        'vue/require-default-prop': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/component-name-in-template-casing': [
          'error',
          'PascalCase',
          { registeredComponentsOnly: false }
        ],
        'vuejs-accessibility/label-has-for': [
          'error',
          {
            required: {
              some: ['nesting', 'id']
            }
          }
        ]
      }
    },
    {
      files: '*.d.ts',
      rules: {
        'no-var': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off'
      }
    }
    // {
    //   files: '*.stories.{js,ts}',
    //   rules: {
    //     // this one feels busted, tells me to await synchronous calls
    //     'storybook/await-interactions': 'off',
    //     // storybook types suck and can't be augmented
    //     '@typescript-eslint/no-unsafe-call': 'off'
    //   }
    // }
  ]
}

module.exports = config
