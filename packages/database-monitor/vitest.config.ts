import path from 'path'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude],
    // reporters: ['verbose', 'hanging-process'] //uncomment to debug hanging processes etc.
    sequence: {
      shuffle: true,
      concurrent: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
