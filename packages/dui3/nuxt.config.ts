import legacy from '@vitejs/plugin-legacy'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    shim: false,
    strict: true
  },
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@speckle/ui-components-nuxt',
    '@pinia/nuxt'
  ],
  alias: {
    // Rewriting all lodash calls to lodash-es for proper tree-shaking & chunk splitting
    lodash: 'lodash-es'
  },

  vite: {
    resolve: {
      alias: [{ find: /^lodash$/, replacement: 'lodash-es' }]
    },

    build: {
      // older chrome version for CEF 65 support. all identifiers except the chrome one are default ones.
      target: ['es2020', 'edge88', 'firefox78', 'chrome65', 'safari14'],
      // optionally disable minification for debugging
      minify: false
    },
    plugins: [
      // again - only for CEF 65
      legacy({
        renderLegacyChunks: false,
        // only adding the specific polyfills we need to reduce bundle size
        modernPolyfills: ['es.global-this', 'es/object', 'es/array']
      })
    ]
  },
  ssr: false,
  build: {
    transpile: [
      /^@apollo\/client/,
      'ts-invariant/process',
      '@vue/apollo-composable',
      '@headlessui/vue',
      /^@heroicons\/vue/,
      '@vueuse/core',
      '@vueuse/shared',
      '@speckle/ui-components'
    ]
  },
  hooks: {
    'build:manifest': (manifest) => {
      // kinda hacky, vite polyfills are incorrectly being loaded last so we have to move them to appear first in the object.
      // we can't replace `manifest` entirely, cause then we're only mutating a local variable, not the actual manifest
      // which is why we have to mutate the reference.
      // since ES2015 object string property order is more or less guaranteed - the order is chronological
      const polyfillKey = 'vite/legacy-polyfills'
      const polyfillEntry = manifest[polyfillKey]
      if (!polyfillEntry) return

      const oldManifest = { ...manifest }
      delete oldManifest[polyfillKey]

      for (const key in manifest) {
        delete manifest[key]
      }

      manifest[polyfillKey] = polyfillEntry
      for (const key in oldManifest) {
        manifest[key] = oldManifest[key]
      }
    }
  }
})
