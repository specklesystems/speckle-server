import { defineConfig } from 'vitest/config'

const IS_E2E = !!process.env.TEST_IS_E2E

const config = defineConfig({
  test: {
    sequence: {
      // we want nuxt init to be run before anything else, so that we can get the nuxt
      // instance in our own beforeAll hooks
      hooks: IS_E2E ? 'stack' : 'parallel'
    },
    testTimeout: IS_E2E ? 100000 : 5000
  }
})

export default config
