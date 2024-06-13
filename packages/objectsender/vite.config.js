import pkg from './package.json'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, './src/index.ts'),
      name: 'objectsender',
      fileName: 'objectsender',
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    rollupOptions: {
      external: Object.keys(pkg.dependencies || {})
    }
  }
})
