import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    sequence: {
      shuffle: true
    },
    fileParallelism: true,
    reporters: ['default', 'html'],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}']
    },
    setupFiles: ['./src/tests/setup.ts']
  }
})
