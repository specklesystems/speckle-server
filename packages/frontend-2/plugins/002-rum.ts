import { trimStart } from 'lodash-es'
import {
  useGetInitialAuthState,
  useOnAuthStateChange
} from '~/lib/auth/composables/auth'
import { useCreateErrorLoggingTransport } from '~/lib/core/composables/error'
import type { Plugin } from 'nuxt/dist/app/nuxt'

type PluginNuxtApp = Parameters<Plugin>[0]

async function initRumClient(app: PluginNuxtApp) {
  const { keys, baseUrl, speckleServerVersion } = resolveInitParams(app)
  const router = useRouter()
  const onAuthStateChange = useOnAuthStateChange()
  const registerErrorTransport = useCreateErrorLoggingTransport()

  // RayGun
  const rg4js = window.rg4js
  if (keys.raygun && rg4js) {
    const setupTags = (extraTags: string[]) => {
      rg4js('withTags', [
        `baseUrl:${baseUrl}`,
        `version:${speckleServerVersion}`,
        ...extraTags
      ])
    }

    router.beforeEach((to, from) => {
      // Update with tags
      const newTags = (to.meta.raygunTags || []) as string[]
      setupTags(newTags)

      if (!from.path || from.path === to.path) return

      rg4js('trackEvent', {
        type: 'pageView',
        path: '/' + trimStart(to.path, '/')
      })
    })

    await onAuthStateChange(
      (user, { resolveDistinctId }) => {
        const distinctId = resolveDistinctId(user)
        rg4js('setUser', {
          identifier: distinctId || '',
          isAnonymous: !distinctId
        })
      },
      { immediate: true }
    )

    registerErrorTransport({
      onError: ({ args, firstError, firstString, otherData, nonObjectOtherData }) => {
        const error = firstError || firstString || args[0]
        rg4js('send', {
          error,
          customData: {
            ...otherData,
            extraData: nonObjectOtherData,
            mainErrorMessage: firstString
          }
        })
      }
      // Apparently unhandleds are auto-handled by raygun
      // onUnhandledError: ({ isUnhandledRejection, error, message }) => {
      //   rg4js('send', {
      //     error: error || message,
      //     customData: {
      //       isUnhandledRejection,
      //       message,
      //       mainErrorMessage: message
      //     }
      //   })
      // }
    })
  }

  // Datadog
  const datadog = window.DD_RUM
  if (keys.datadog && datadog) {
    await onAuthStateChange(
      (user, { resolveDistinctId }) => {
        const distinctId = resolveDistinctId(user)
        // setUser might not be there, if blocked by adblock
        if (!datadog || !('setUser' in datadog)) return

        if (distinctId && user) {
          datadog.setUser({
            id: distinctId
          })
        } else {
          datadog.clearUser()
        }
      },
      { immediate: true }
    )

    router.beforeEach((to, from) => {
      if (!('setUser' in datadog)) return
      if (!from.path || from.path === to.path) return

      const pathDefinition = to.matched[to.matched.length - 1].path
      const routeName = to.meta.datadogName

      datadog.startView({
        name: routeName || pathDefinition || 'unknown'
      })
    })
  }
}

async function initRumServer(app: PluginNuxtApp) {
  const registerErrorTransport = useCreateErrorLoggingTransport()
  const { keys, baseUrl, speckleServerVersion, debug, debugCoreWebVitals } =
    resolveInitParams(app)
  const initUser = useGetInitialAuthState()

  // CWV
  if (debugCoreWebVitals) {
    app.hook('app:rendered', (context) => {
      context.ssrContext!.head.push({
        script: [
          {
            innerHTML: `
              import {
                onCLS,
                onFID,
                onLCP,
                onINP,
                onTTFB
              } from 'https://unpkg.com/web-vitals@3/dist/web-vitals.attribution.js?module';

              onCLS(console.log);
              onFID(console.log);
              onLCP(console.log);
              onINP(console.log);
              onTTFB(console.log);
              `,
            type: 'module'
          }
        ]
      })
    })
  }

  // RayGun
  if (keys.raygun) {
    const raygun = (await import('raygun')).default
    const raygunClient = new raygun.Client().init({
      apiKey: keys.raygun,
      batch: true,
      reportUncaughtExceptions: true
    })

    registerErrorTransport({
      onError: ({ firstError, firstString, otherData, nonObjectOtherData }) => {
        const error = firstError || firstString || 'Unknown error'
        raygunClient.send(error, {
          ...otherData,
          extraData: nonObjectOtherData,
          mainErrorMessage: firstString
        })
      }
    })

    // Add client-side snippet
    app.hook('app:rendered', (context) => {
      const initRaygunTags = app._route?.meta.raygunTags || []

      context.ssrContext!.head.push({
        script: [
          {
            innerHTML: `!function(a,b,c,d,e,f,g,h){a.RaygunObject=e,a[e]=a[e]||function(){
  (a[e].o=a[e].o||[]).push(arguments)},f=b.createElement(c),g=b.getElementsByTagName(c)[0],
  f.async=1,f.src=d,g.parentNode.insertBefore(f,g),h=a.onerror,a.onerror=function(b,c,d,f,g){
  h&&h(b,c,d,f,g),g||(g=new Error(b)),a[e].q=a[e].q||[],a[e].q.push({
  e:g})}}(window,document,"script","//cdn.raygun.io/raygun4js/raygun.min.js","rg4js");`
          },
          {
            innerHTML: `
                rg4js('apiKey', '${keys.raygun}')
                rg4js('enableCrashReporting', true)
                rg4js('enablePulse', true)
                rg4js('withTags', ['baseUrl:${baseUrl}', 'version:${speckleServerVersion}', ...${JSON.stringify(
              initRaygunTags
            )}])
                rg4js('options', {
                  debugMode: ${!!debug},
                })
            `
          }
        ]
      })
    })
  }

  // Datadog
  if (keys.datadog) {
    const {
      datadogAppId,
      datadogClientToken,
      datadogSite,
      datadogService,
      datadogEnv
    } = keys.datadog

    const { distinctId } = await initUser()

    app.hook('app:rendered', (context) => {
      const route = app._route
      const pathDefinition = route.matched[route.matched.length - 1].path
      const routeName = route.meta.datadogName

      context.ssrContext!.head.push({
        script: [
          {
            innerHTML:
              `
              (function(h,o,u,n,d) {
                h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
                d=o.createElement(u);d.async=1;d.src=n
                n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
              })(window,document,'script','https://www.datadoghq-browser-agent.com/eu1/v5/datadog-rum.js','DD_RUM')
              window.DD_RUM.onReady(function() {
                ` +
              (distinctId ? `window.DD_RUM.setUser({ id: '${distinctId}' });` : '') +
              `
                window.DD_RUM.setGlobalContextProperty('serverBaseUrl', '${baseUrl}');
                window.DD_RUM.init({
                  clientToken: '${datadogClientToken}',
                  applicationId: '${datadogAppId}',
                  site: '${datadogSite}',
                  service: '${datadogService}',
                  env: '${datadogEnv || 'unknown'}',
                  version: '${speckleServerVersion}', 
                  sessionSampleRate: 100,
                  sessionReplaySampleRate: 0,
                  trackUserInteractions: true,
                  trackResources: true,
                  trackLongTasks: true,
                  defaultPrivacyLevel: 'mask-user-input',
                  trackViewsManually: true
                });
                window.DD_RUM.startView({
                  name: '${routeName || pathDefinition || 'unknown'}'
                })
              })
          `
          }
        ]
      })
    })
  }
}

function resolveInitParams(app: PluginNuxtApp) {
  const {
    public: {
      raygunKey,
      speckleServerVersion,
      logCsrEmitProps,
      baseUrl,
      debugCoreWebVitals,
      datadogClientToken,
      datadogAppId,
      datadogSite,
      datadogService,
      datadogEnv
    }
  } = useRuntimeConfig()
  const logger = useLogger()
  const raygun = raygunKey?.length ? raygunKey : null
  const datadog =
    datadogClientToken?.length &&
    datadogAppId?.length &&
    datadogSite?.length &&
    datadogService?.length &&
    datadogEnv?.length
      ? { datadogClientToken, datadogAppId, datadogSite, datadogService, datadogEnv }
      : null

  const shouldDebugCoreWebVitals = debugCoreWebVitals || app._route?.query.cwv === '1'

  return {
    keys: {
      raygun,
      datadog
    },
    speckleServerVersion,
    baseUrl,
    debug: logCsrEmitProps && process.dev,
    debugCoreWebVitals: shouldDebugCoreWebVitals,
    logger
  }
}

export default defineNuxtPlugin(async (app) => {
  if (process.server) {
    await initRumServer(app)
  } else {
    await initRumClient(app)
  }
})
