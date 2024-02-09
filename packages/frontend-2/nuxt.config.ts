import { join } from 'path'
import { withoutLeadingSlash } from 'ufo'
import { sanitizeFilePath } from 'mlly'
import { filename } from 'pathe/utils'
import legacy from '@vitejs/plugin-legacy'

// Copied out from nuxt vite-builder source to correctly build output chunk/entry/asset/etc file names
const buildOutputFileName = (chunkName: string) =>
  withoutLeadingSlash(
    join('/_nuxt/', `${sanitizeFilePath(filename(chunkName))}.[hash].js`)
  )

const {
  SPECKLE_SERVER_VERSION,
  NUXT_PUBLIC_LOG_LEVEL = 'info',
  NUXT_PUBLIC_LOG_PRETTY = false
} = process.env

const isLogPretty = ['1', 'true', true, 1].includes(NUXT_PUBLIC_LOG_PRETTY)

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
    ],
    '@speckle/ui-components-nuxt',
    '@artmizu/nuxt-prometheus'
  ],
  runtimeConfig: {
    redisUrl: '',
    public: {
      apiOrigin: 'UNDEFINED',
      backendApiOrigin: '',
      baseUrl: '',
      mixpanelApiHost: 'UNDEFINED',
      mixpanelTokenId: 'UNDEFINED',
      logLevel: NUXT_PUBLIC_LOG_LEVEL,
      logPretty: isLogPretty,
      logCsrEmitProps: false,
      logClientApiToken: '',
      logClientApiEndpoint: '',
      speckleServerVersion: SPECKLE_SERVER_VERSION || 'unknown',
      serverName: 'UNDEFINED',
      viewerDebug: false
    }
  },

  alias: {
    // Rewriting all lodash calls to lodash-es for proper tree-shaking & chunk splitting
    lodash: 'lodash-es'
    // '@vue/apollo-composable': '@speckle/vue-apollo-composable'
  },

  vite: {
    vue: {
      script: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        defineModel: true
      }
    },

    resolve: {
      alias: [{ find: /^lodash$/, replacement: 'lodash-es' }],
      // i've no idea why, but the same version of various deps gets bundled twice
      // in the case of vee-validate, this is just a guess, but maybe it gets confused cause there's a vee-validate install both under ui-components
      // and also under frontend-2. they're the same version, but apparently that's not enough...
      dedupe: ['prosemirror-state', '@tiptap/pm', 'prosemirror-model', 'vee-validate']
    },
    server: {
      fs: {
        // Allowing symlinks
        // allow: ['/home/fabis/Code/random/vue-apollo/']
      }
    },

    build: {
      rollupOptions: {
        output: {
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
      // // optionally disable minification for debugging
      // minify: false,
      // // optionally enable sourcemaps for debugging
      // sourcemap: 'inline'
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
      headers: {
        'access-control-allow-methods': 'GET',
        'Access-Control-Expose-Headers': '*'
      }
    },
    '/authn/login': {
      cors: true,
      headers: {
        'access-control-allow-methods': 'GET',
        'Access-Control-Expose-Headers': '*'
      }
    }
  },

  nitro: {
    compressPublicAssets: true
  },

  build: {
    transpile: [
      /^@apollo\/client/,
      'ts-invariant/process',
      '@vue/apollo-composable',
      '@speckle/vue-apollo-composable',
      '@headlessui/vue',
      /^@heroicons\/vue/,
      '@vueuse/core',
      '@vueuse/shared',
      '@speckle/ui-components',
      'v3-infinite-loading',
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
  },

  prometheus: {
    verbose: false
  }
})
