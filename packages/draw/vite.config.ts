import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import path from 'path'
import { resolve } from 'path'
import pkg from './package.json'

export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true
      }
    }) as Plugin,
    dts({
      entryRoot: '.',
      outDir: 'dist',
      copyDtsFiles: true,
      include: ['components/**/*.vue', 'lib.ts']
    })
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname)
    }
  },
  build: {
    outDir: 'dist',
    lib: false, // 👈 disable single-entry lib mode
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'lib.ts'),
        CanvasInfinite: path.resolve(__dirname, 'components/canvas/Infinite.vue'),
        CanvasToolbar: path.resolve(__dirname, 'components/canvas/Toolbar.vue')
      },
      external: ['vue', 'pinia', 'konva', 'vue-konva']
    }
  }
})
