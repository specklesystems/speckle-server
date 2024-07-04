import path from 'path'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude],
    globalSetup: ['./tests/hooks/globalSetup.ts'],
    // reporters: ['verbose', 'hanging-process'] //uncomment to debug hanging processes etc.
    sequence: {
      shuffle: true,
      concurrent: true
    }
  },
  resolve: {
    alias: {
      '#src': path.resolve(__dirname, './src'),
      '#tests': path.resolve(__dirname, './tests')
    }
  }
})
