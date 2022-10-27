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
    lodash: 'lodash-es',
    // TODO: Why is this happening? Something's borked, we should not need to import these
    crypto: require.resolve('rollup-plugin-node-builtins'),
    zlib: require.resolve('browserify-zlib')
  },
  vite: {
    resolve: {
      alias: [{ find: /^lodash$/, replacement: 'lodash-es' }]
    }
    // TODO: Exclude from storybook build
    // assetsInclude: ['**/*.mdx']
  },
  build: {
    transpile: [/^@apollo\/client/, 'ts-invariant/process', '@vue/apollo-composable']
  }
})
