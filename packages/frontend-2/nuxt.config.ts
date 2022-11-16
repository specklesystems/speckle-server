const { API_ORIGIN, IS_STORYBOOK_BUILD, MIXPANEL_TOKEN_ID, MIXPANEL_API_HOST } =
  process.env

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
      API_ORIGIN,
      MIXPANEL_API_HOST,
      MIXPANEL_TOKEN_ID
    }
  },

  alias: {
    // Rewriting all lodash calls to lodash-es for proper tree-shaking & chunk splitting
    lodash: 'lodash-es',
    '@vue/apollo-composable': '@speckle/vue-apollo-composable',
    // We need browser polyfills for crypto & zlib cause they seem to be bundled for the web
    // for some reason when running the dev server or storybook. Doesn't appear that these
    // actually appear in any client-side bundles tho!
    crypto: require.resolve('rollup-plugin-node-builtins'),
    zlib: require.resolve('browserify-zlib')
  },

  vite: {
    resolve: {
      alias: [{ find: /^lodash$/, replacement: 'lodash-es' }]
    },
    ...(IS_STORYBOOK_BUILD
      ? {}
      : {
          assetsInclude: ['**/*.mdx']
        }),
    server: {
      fs: {
        // Allowing symlinks
        // allow: ['/home/fabis/Code/random/vue-apollo/']
      }
    }
  },

  build: {
    transpile: [
      /^@apollo\/client/,
      'ts-invariant/process',
      '@vue/apollo-composable',
      '@headlessui/vue',
      '@heroicons/vue',
      '@vueuse/core'
    ]
  }
})
