import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import pkg from './package.json'
import { resolve } from 'path'

type SafePkg = typeof pkg & { [key: string]: unknown }
const safePkg = pkg as SafePkg

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts(), vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib.ts'),
      name: 'SpeckleUiComponents',
      fileName: 'lib',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        ...Object.keys(safePkg.dependencies || {}).map(
          (d) => new RegExp(`^${d}(\\/.*)?$`)
        ),
        ...Object.keys(safePkg.peerDependencies || {}).map(
          (d) => new RegExp(`^${d}(\\/.*)?$`)
        )
      ]
    }
  },

  resolve: {
    alias: {
      // We need browser polyfills for crypto & zlib cause they seem to be bundled for the web
      // for some reason when running storybook. Doesn't appear that these
      // actually appear in any client-side bundles tho!
      crypto: 'rollup-plugin-node-builtins',
      zlib: 'browserify-zlib'
    }
  }
})
