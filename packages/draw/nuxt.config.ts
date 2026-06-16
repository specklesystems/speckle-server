// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        }
      ]
    }
  },
  devServer: {
    host: '0.0.0.0',
    port: 8084
  },
  ssr: false,
  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@speckle/ui-components-nuxt',
    '@pinia/nuxt'
  ],
  build: {
    transpile: [
      '@headlessui/vue',
      /^@heroicons\/vue/,
      '@vueuse/core',
      '@vueuse/shared',
      '@speckle/ui-components',
      'v3-infinite-loading',
      'mdi-vue'
    ]
  },
  vite: {
    resolve: {
      dedupe: ['vee-validate'],
      alias: [{ find: /^lodash(?!(-es|\/fp|\.))/, replacement: 'lodash-es' }]
    }
  },
  alias: {
    dayjs: 'dayjs'
  },
  imports: {
    dirs: ['types']
  },
  css: ['~/assets/css/tailwind.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  runtimeConfig: {
    public: {
      appId: process.env.DRAW_APP_ID ?? 'aa893ec0a4', // note: prod app
      appSecret: process.env.DRAW_APP_SECRET ?? '6fed9aba75' // note: prod app
    }
  }
})
