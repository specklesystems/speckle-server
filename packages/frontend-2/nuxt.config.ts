import { join } from 'path'
import { sanitizeFilePath } from 'mlly'
import { filename } from 'pathe/utils'
import * as Environment from '@speckle/shared/environment'
import { defineNuxtConfig } from 'nuxt/config'

// Copied out from nuxt vite-builder source to correctly build output chunk/entry/asset/etc file names
const withoutLeadingSlash = (path: string) => path.replace(/^\//, '')
const buildOutputFileName = (chunkName: string) =>
  withoutLeadingSlash(
    join('/_nuxt/', `${sanitizeFilePath(filename(chunkName))}.[hash].js`)
  )

const {
  SPECKLE_SERVER_VERSION,
  NUXT_PUBLIC_LOG_LEVEL = 'info',
  NUXT_PUBLIC_LOG_PRETTY = false,
  BUILD_SOURCEMAPS = 'false',
  HYDRATION_MISMATCH_REPORTING = 'false'
} = process.env

const featureFlags = Environment.getFeatureFlags()

const isLogPretty = ['1', 'true', true, 1].includes(NUXT_PUBLIC_LOG_PRETTY)
const buildSourceMaps = ['1', 'true', true, 1].includes(BUILD_SOURCEMAPS)
const hydrationMismatchReportingEnabled = ['1', 'true', true, 1].includes(
  HYDRATION_MISMATCH_REPORTING
)

const external = ['ioredis', 'jsdom']

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  ...(buildSourceMaps ? { sourcemap: true } : {}),
  modulesDir: ['./node_modules'],
  typescript: {
    shim: false,
    strict: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
        // TODO: More correct, but requires a lot of (minor) changes
        noUncheckedIndexedAccess: false
      }
    }
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/devtools',
    '@nuxt/image',
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
      apiOrigin: '',
      backendApiOrigin: '',
      baseUrl: '',
      mixpanelApiHost: '',
      mixpanelTokenId: '',
      logLevel: NUXT_PUBLIC_LOG_LEVEL,
      logPretty: isLogPretty,
      logCsrEmitProps: false,
      logClientApiToken: '',
      logClientApiEndpoint: '',
      speckleServerVersion: SPECKLE_SERVER_VERSION || 'unknown',
      serverName: 'unknown',
      viewerDebug: false,
      debugCoreWebVitals: false,
      datadogAppId: '',
      datadogClientToken: '',
      datadogSite: '',
      datadogService: '',
      datadogEnv: '',
      intercomAppId: '',
      dashboardsOrigin: '',
      parallelMiddlewares: true,
      disableViewerActivityBroadcasting: false
    }
  },

  experimental: {
    emitRouteChunkError: 'automatic-immediate',
    asyncContext: true // necessary for parallel middlewares
  },

  alias: {
    // Rewriting all lodash calls to lodash-es for proper tree-shaking & chunk splitting
    // lodash: 'lodash-es'
    // '@vue/apollo-composable': '@speckle/vue-apollo-composable'
  },

  vite: {
    define: {
      ...(hydrationMismatchReportingEnabled
        ? {
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true'
          }
        : {})
    },

    ssr: {
      external
    },

    optimizeDeps: {
      // Should only be ran on serverside anyway. W/o this it tries to transpile it unsuccessfully
      exclude: external
    },

    vue: {
      script: {
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
        },
        // Leave imports as is, they're server-side only
        external: ['jsdom']
      }
      // // optionally disable minification for debugging
      // minify: false,
      // // optionally enable sourcemaps for debugging
      // sourcemap: 'inline'
    }
  },

  routeRules: {
    '/**': {
      headers: {
        // No search engine indexing on any of the pages anywhere! TODO: Come up with a more appropriate policy
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      },
      appMiddleware: [
        // Has to be applied to all pages and as the very last app middleware (hence the 999 prefix)
        '999-parallel-finalize'
      ]
    },
    '/functions': {
      redirect: {
        to: '/',
        statusCode: 307
      }
    },
    // Redirect old settings pages
    '/server-management/projects': {
      redirect: {
        to: '/settings/server/projects',
        statusCode: 301
      }
    },
    '/server-management/active-users': {
      redirect: {
        to: '/settings/server/active-users',
        statusCode: 301
      }
    },
    '/server-management/pending-invitations': {
      redirect: {
        to: '/settings/server/pending-invitations',
        statusCode: 301
      }
    },
    '/server-management': {
      redirect: {
        to: '/settings/server/general',
        statusCode: 301
      }
    },
    '/profile': {
      redirect: {
        to: '/settings/user/profile',
        statusCode: 301
      }
    },
    '/settings/server/active-users': {
      redirect: {
        to: '/settings/server/members',
        statusCode: 301
      }
    },
    '/settings/server/pending-invitations': {
      redirect: {
        to: '/settings/server/members',
        statusCode: 301
      }
    },
    // Redirect old settings - End
    '/settings/**': {
      appMiddleware: ['auth', 'settings']
    },
    '/settings/server/*': {
      appMiddleware: ['auth', 'settings', 'admin']
    },
    '/settings/workspaces/:slug/*': {
      appMiddleware: [
        'auth',
        'settings',
        'requires-workspaces-enabled',
        'require-valid-workspace'
      ]
    },
    '/downloads': {
      redirect: {
        to: 'https://www.speckle.systems/connectors',
        statusCode: 301
      }
    },
    '/workspaces': {
      redirect: {
        to: '/workspaces/actions/create',
        statusCode: 301
      }
    }
  },

  nitro: {
    compressPublicAssets: true,
    externals: {
      external
    }
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  prometheus: {
    verbose: false
  },
  features: {
    devLogs: true
  }
})
