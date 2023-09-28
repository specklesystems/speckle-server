import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueMacros from 'unplugin-vue-macros/vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'
import { resolve } from 'path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      exclude: ['**/*.stories.ts', '**/*.test.ts', '**/*.spec.ts', '.storybook/**/*']
    }),
    vueMacros({
      plugins: {
        vue: vue({
          script: {
            defineModel: true
          }
        })
      }
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib.ts'),
      name: 'SpeckleUiComponents',
      fileName: 'lib',
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        ...Object.keys(pkg.dependencies || {}).map((d) => new RegExp(`^${d}(\\/.*)?$`)),
        ...Object.keys(pkg.peerDependencies || {}).map(
          (d) => new RegExp(`^${d}(\\/.*)?$`)
        ),
        // Don't build stories
        /\.stories\.ts$/i,
        /\.storybook/i
      ]
    }
  },

  resolve: {
    alias: {
      // We need browser polyfills for crypto & zlib cause they seem to be bundled for the web
      // for some reason when running storybook. Doesn't appear that these
      // actually appear in any client-side bundles tho!
      crypto: require.resolve('rollup-plugin-node-builtins'),
      zlib: require.resolve('browserify-zlib'),
      '~~/src': resolve(__dirname, './src')
    }
  }
})
