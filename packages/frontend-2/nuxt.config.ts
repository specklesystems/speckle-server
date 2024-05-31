import { join } from 'path'
import { withoutLeadingSlash } from 'ufo'
import { sanitizeFilePath } from 'mlly'
import { filename } from 'pathe/utils'
import { Environment } from '@speckle/shared'

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

const featureFlags = Environment.getFeatureFlags()

const isLogPretty = ['1', 'true', true, 1].includes(NUXT_PUBLIC_LOG_PRETTY)

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    shim: false,
    strict: true
  },
  features: {
    // while nuxt's implementation is broken, we disable this: https://github.com/nuxt/nuxt/issues/26369
    devLogs: false
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
      ...featureFlags,
      apiOrigin: 'UNDEFINED',
      backendApiOrigin: '',
      baseUrl: '',
      mixpanelApiHost: 'UNDEFINED',
      mixpanelTokenId: 'UNDEFINED',
      survicateWorkspaceKey: '',
      logLevel: NUXT_PUBLIC_LOG_LEVEL,
      logPretty: isLogPretty,
      logCsrEmitProps: false,
      logClientApiToken: '',
      logClientApiEndpoint: '',
      speckleServerVersion: SPECKLE_SERVER_VERSION || 'unknown',
      serverName: 'UNDEFINED',
      viewerDebug: false,
      raygunKey: '',
      logrocketAppId: '',
      speedcurveId: 0,
      debugbearId: '',
      debugCoreWebVitals: false,
      datadogAppId: '',
      datadogClientToken: '',
      datadogSite: '',
      datadogService: '',
      datadogEnv: '',
      enableDirectPreviews: true
    }
  },

  alias: {
    // Rewriting all lodash calls to lodash-es for proper tree-shaking & chunk splitting
    // lodash: 'lodash-es'
    // '@vue/apollo-composable': '@speckle/vue-apollo-composable'
  },

  vite: {
    optimizeDeps: {
      // Should only be ran on serverside anyway. W/o this it tries to transpile it unsuccessfully
      exclude: ['jsdom']
    },

    vue: {
      script: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        defineModel: true
      }
    },

    resolve: {
      alias: [{ find: /^lodash(?!(-es|\/fp|\.))/, replacement: 'lodash-es' }],
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
      }
      // // optionally disable minification for debugging
      // minify: false,
      // // optionally enable sourcemaps for debugging
      // sourcemap: 'inline'
    }
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
      /prosemirror.*/,
      /^lodash(?!-es)/,
      // w/o these there's a weird error where Kind from graphql is undefined in dev mode
      'graphql',
      /^graphql\/.+/,
      'graphql/language/printer',
      'graphql/utilities/getOperationAST'
    ]
  },
  prometheus: {
    verbose: false
  }
})
