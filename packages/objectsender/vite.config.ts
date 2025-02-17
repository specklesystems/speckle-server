/// <reference types="vitest" />
import pkg from './package.json'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'objectsender',
      fileName: 'objectsender',
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    rollupOptions: {
      external: Object.keys(pkg.dependencies || {})
    }
  },
  plugins: [dts()]
})
