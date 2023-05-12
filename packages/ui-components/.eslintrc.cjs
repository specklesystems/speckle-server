const mainExtends = [
  'plugin:vue/vue3-recommended',
  'plugin:storybook/recommended',
  'prettier'
]

/** @type {import('eslint').Linter.Config} */
const config = {
  env: {
    node: true
  },

  extends: [...mainExtends],
  ignorePatterns: ['storybook-static', '!.storybook', 'tailwind-configure.d.ts'],
  rules: {
    'no-alert': 'error',
    eqeqeq: ['error', 'always', { null: 'always' }],
    'no-console': 'off',
    'no-var': 'error'
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  overrides: [
    {
      files: '*.test.{ts,js}',
      env: {
        jest: true
      }
    },
    {
      files: './src/*.{js,ts,vue}',
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
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parser: '@typescript-eslint/parser',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json', './tsconfig.node.json'],
        extraFileExtensions: ['.vue']
      },
      plugins: ['@typescript-eslint']
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
    },
    {
      files: '*.stories.{js,ts}',
      rules: {
        // this one feels busted, tells me to await synchronous calls
        'storybook/await-interactions': 'off',
        // storybook types suck and can't be augmented
        '@typescript-eslint/no-unsafe-call': 'off'
      }
    }
  ]
}

module.exports = config
