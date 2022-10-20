const { API_ORIGIN } = process.env

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    shim: false,
    strict: true
  },

  modules: [
    '@nuxtjs/tailwindcss',
    [
      '~/lib/core/nuxt-modules/apollo/module.ts',
      {
        configResolvers: {
          default: '~/lib/core/configs/apollo.ts'
        }
      }
    ]
  ],

  runtimeConfig: {
    public: {
      API_ORIGIN
    }
  },

  alias: {
    // Rewriting all lodash calls to lodash-es for proper tree-shaking & chunk splitting
    lodash: 'lodash-es'
  },
  vite: {
    resolve: {
      alias: [{ find: /^lodash$/, replacement: 'lodash-es' }]
    }
  },
  build: {
    transpile: [/^@apollo\/client/, 'ts-invariant/process', '@vue/apollo-composable']
  }
})
