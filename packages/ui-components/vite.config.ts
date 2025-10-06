import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import pkg from './package.json'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      exclude: ['**/*.stories.ts', '**/*.test.ts', '**/*.spec.ts', '.storybook/**/*']
    }),
    vue({
      script: {
        defineModel: true
      }
    }) as Plugin
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
      '~~/src': resolve(__dirname, './src')
    }
  }
})
