import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import gql from 'vite-plugin-simple-gql'

const port = '8080'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        transformAssetUrls: {
          // defaults
          video: ['src', 'poster'],
          source: ['src'],
          img: ['src'],
          image: ['xlink:href', 'href'],
          use: ['xlink:href', 'href'],
          // support for vuetify components
          'v-img': ['src']
        }
      }
    }),
    Components({
      resolvers: [VuetifyResolver()],
      dts: './src/type-augmentations/unplugin-components.d.ts'
    }),
    gql()
  ],
  server: {
    host: '127.0.0.1',
    port,
    hmr: {
      port
    }
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      '@': path.resolve(__dirname, './src'),
      // redirects lodash to lodash-es in prod build, for a reduced & tree-shaked bundle
      lodash: 'lodash-es'
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  css: {
    // https://vitejs.dev/config/#css-preprocessoroptions
    preprocessorOptions: {
      sass: {
        additionalData: [
          // vuetify variable overrides
          '@import "@/sass/variables.scss"',
          ''
        ].join('\n')
      }
    }
  },

  optimizeDeps: {
    include: ['vuetify', 'vuetify/lib']
  }
})
