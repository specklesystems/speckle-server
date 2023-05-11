import { join } from 'path'
import type { OutputOptions } from 'rollup'
import { withoutLeadingSlash } from 'ufo'
import { sanitizeFilePath } from 'mlly'
import { filename } from 'pathe/utils'
import legacy from '@vitejs/plugin-legacy'

// Copied out from nuxt vite-builder source to correctly build output chunk/entry/asset/etc file names
const buildOutputFileName = (chunkName: string) =>
  withoutLeadingSlash(
    join('/_nuxt/', `${sanitizeFilePath(filename(chunkName))}.[hash].js`)
  )

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    shim: false,
    strict: true
  },
  modules: [
    '@nuxt/devtools',
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
      apiOrigin: 'UNDEFINED',
      mixpanelApiHost: 'UNDEFINED',
      mixpanelTokenId: 'UNDEFINED'
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
      alias: [{ find: /^lodash$/, replacement: 'lodash-es' }],
      // i've no idea why, but the same version of various prosemirror deps gets bundled twice
      dedupe: ['prosemirror-state', '@tiptap/pm', 'prosemirror-model']
    },
    ...(process.env.IS_STORYBOOK_BUILD
      ? {}
      : {
          assetsInclude: ['**/*.mdx']
        }),
    server: {
      fs: {
        // Allowing symlinks
        // allow: ['/home/fabis/Code/random/vue-apollo/']
      }
    },

    build: {
      rollupOptions: {
        output: <OutputOptions>{
          /**
           * Overriding some output file names to avoid adblock
           */
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name.includes('mixpanel')) {
              return buildOutputFileName('mp')
            }

            return buildOutputFileName(chunkInfo.name)
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name.includes('mixpanel')) {
              return buildOutputFileName('mp-chunk')
            }

            return buildOutputFileName(chunkInfo.name)
          }
        }
      },
      // older chrome version for CEF 65 support. all identifiers except the chrome one are default ones.
      target: ['es2020', 'edge88', 'firefox78', 'chrome65', 'safari14']
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

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  routeRules: {
    // Necessary because of redirects from backend in auth flows
    '/': {
      cors: true,
      headers: { 'access-control-allow-methods': 'GET' }
    },
    '/authn/login': {
      cors: true,
      headers: { 'access-control-allow-methods': 'GET' }
    }
  },

  build: {
    transpile: [
      /^@apollo\/client/,
      'ts-invariant/process',
      '@vue/apollo-composable',
      '@speckle/vue-apollo-composable',
      '@headlessui/vue',
      '@heroicons/vue',
      '@vueuse/core',
      /prosemirror.*/
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
