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
  },
  overrides: [
    {
      files: '*.ts',
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
        project: ['./tsconfig.json']
      },
      plugins: ['@typescript-eslint']
    },
    {
      files: '*.d.ts',
      rules: {
        'no-var': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
        'no-unused-vars': 'off'
      }
    }
  ]
}

module.exports = config
