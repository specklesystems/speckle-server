import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude],
    globalSetup: ['./tests/hooks.ts']
    // reporters: ['verbose', 'hanging-process'] //uncomment to debug hanging processes etc.
  }
})
