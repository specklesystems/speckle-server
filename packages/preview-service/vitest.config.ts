import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude],
    globalSetup: ['./tests/hooks/globalSetup.ts'],
    setupFiles: ['./tests/hooks/setup.ts']
    // reporters: ['verbose', 'hanging-process'] //uncomment to debug hanging processes etc.
  }
})
