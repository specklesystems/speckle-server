import {
  useGetInitialAuthState,
  useOnAuthStateChange
} from '~/lib/auth/composables/auth'
import { useCreateErrorLoggingTransport } from '~/lib/core/composables/error'
import type { Plugin } from 'nuxt/dist/app/nuxt'
import { isH3Error } from '~/lib/common/helpers/error'
import { useRequestId, useServerRequestId } from '~/lib/core/composables/server'
import { isBrave, isSafari } from '@speckle/shared'
import { isString } from 'lodash-es'

type PluginNuxtApp = Parameters<Plugin>[0]

function initRumClient(app: PluginNuxtApp) {
  const { keys } = resolveInitParams(app)
  const router = useRouter()
  const onAuthStateChange = useOnAuthStateChange()
  const registerErrorTransport = useCreateErrorLoggingTransport()
  const reqId = useRequestId()

  // Datadog
  const datadog = window.DD_RUM
  if (keys.datadog && datadog) {
    datadog.onReady(async () => {
      if ('setGlobalContextProperty' in datadog && reqId?.length) {
        datadog.setGlobalContextProperty('requestId', reqId)

        if (isSafari()) {
          datadog.setGlobalContextProperty('isSafari', 'true')
        }

        if (isBrave()) {
          datadog.setGlobalContextProperty('isBrave', 'true')
        }
      }

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

      router.beforeEach((to) => {
        const pathDefinition = getRouteDefinition(to)
        const routeName = (to.meta.datadogName || pathDefinition) as string
        const realPath = to.path

        window.DD_RUM_START_VIEW?.(realPath, routeName)
      })

      const resolveH3Data = (error: unknown) =>
        error && isH3Error(error)
          ? {
              statusCode: error.statusCode,
              fatal: error.fatal,
              statusMessage: error.statusMessage,
              h3Data: error.data
            }
          : {}

      registerErrorTransport({
        onError: (
          { args, firstError, firstString, otherData, nonObjectOtherData },
          { prettifyMessage }
        ) => {
          if (!datadog || !('addError' in datadog)) return

          let error = firstError || firstString || args[0]
          const mainErrorMessageTemplate = firstString
          const mainErrorMessage = mainErrorMessageTemplate
            ? prettifyMessage(mainErrorMessageTemplate)
            : undefined

          if (isString(error)) {
            error = prettifyMessage(error)
          }

          datadog.addError(error, {
            ...otherData,
            ...resolveH3Data(firstError),
            extraData: nonObjectOtherData,
            mainErrorMessageTemplate,
            mainErrorMessage,
            isProperlySentError: true
          })
        },
        onUnhandledError: ({ isUnhandledRejection, error, message }) => {
          if (!datadog || !('addError' in datadog)) return

          datadog.addError(error || message, {
            ...resolveH3Data(error),
            isUnhandledRejection,
            message,
            mainErrorMessage: message,
            isProperlySentError: true
          })
        }
      })
    })
  }
}

async function initRumServer(app: PluginNuxtApp) {
  const { keys, baseUrl, speckleServerVersion, debugCoreWebVitals } =
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
              } from 'https://cdn.jsdelivr.net/npm/web-vitals@3/dist/web-vitals.attribution.js?module';

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
      const serverReqId = useServerRequestId()
      const route = app._route
      const pathDefinition = getRouteDefinition(route)
      const pathReal = route.path
      const routeName = route.meta.datadogName || pathDefinition

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

                ` +
              (serverReqId.value
                ? `window.DD_RUM.setGlobalContextProperty('serverRequestId', '${serverReqId.value}');`
                : '') +
              `

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
                  trackViewsManually: true,
                  beforeSend: (event) => {
                    if (event?.type === 'error') {
                      if (!event.context?.isProperlySentError) return false
                      delete event.context.isProperlySentError
                    }
                    return true 
                  }
                });

                window.DD_RUM_START_VIEW = (path, name) => {
                  if (window.DD_RUM_REGISTERED_PATH === path) return

                  window.DD_RUM_REGISTERED_PATH = path
                  window.DD_RUM.startView({
                    name
                  })
                  console.debug('DDR Started view: ' + name)
                }
                window.DD_RUM_START_VIEW('${pathReal}', '${routeName}')
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
      datadog
    },
    speckleServerVersion,
    baseUrl,
    debug: logCsrEmitProps && import.meta.dev,
    debugCoreWebVitals: shouldDebugCoreWebVitals,
    logger
  }
}

export default defineNuxtPlugin(async (app) => {
  if (import.meta.server) {
    await initRumServer(app)
  } else {
    initRumClient(app)
  }
})
