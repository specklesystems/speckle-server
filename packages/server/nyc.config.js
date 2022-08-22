const testFileExtensions = ['ts', 'js']

module.exports = {
  exclude: [
    `**/migrations/*.{${testFileExtensions}}`,
    `**/modules/cli/**/*.{${testFileExtensions}}`,
    '**/*.spec.{js,ts}',

    // Default exclusions: https://github.com/istanbuljs/schema/blob/master/default-exclude.js
    'coverage/**',
    'packages/*/test{,s}/**',
    '**/*.d.ts',
    'test{,s}/**',
    `test{,-*}.{${testFileExtensions}}`,
    `**/*{.,-}test.{${testFileExtensions}}`,
    '**/__tests__/**',
    '**/{ava,babel,nyc}.config.{js,cjs,mjs}',
    '**/jest.config.{js,cjs,mjs,ts}',
    '**/{karma,rollup,webpack}.config.js',
    '**/.{eslint,mocha}rc.{js,cjs}'
  ]
}
