import { trimStart } from 'lodash-es'
import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useCreateErrorLoggingTransport } from '~/lib/core/composables/error'
import type { Plugin } from 'nuxt/dist/app/nuxt'

type PluginNuxtApp = Parameters<Plugin>[0]

async function initRumClient() {
  const { enabled, keys } = resolveInitParams()
  const router = useRouter()
  const onAuthStateChange = useOnAuthStateChange()
  const registerErrorTransport = useCreateErrorLoggingTransport()
  if (!enabled) return

  // RayGun
  const rg4js = window.rg4js
  if (keys.raygun && rg4js) {
    router.beforeEach((to, from) => {
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
}

async function initRumServer(app: PluginNuxtApp) {
  const registerErrorTransport = useCreateErrorLoggingTransport()
  const { enabled, keys, baseUrl, speckleServerVersion, debug } = resolveInitParams()
  if (!enabled) return

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
                rg4js('withTags', ['baseUrl:${baseUrl}', 'version:${speckleServerVersion}'])
                rg4js('options', {
                  debugMode: ${!!debug},
                })
            `
          }
        ]
      })
    })
  }
}

function resolveInitParams() {
  const {
    public: { raygunKey, speckleServerVersion, logCsrEmitProps, baseUrl }
  } = useRuntimeConfig()
  const raygun = raygunKey?.length ? raygunKey : null
  const enabled = !!raygun

  return {
    enabled,
    keys: {
      raygun
    },
    speckleServerVersion,
    baseUrl,
    debug: logCsrEmitProps && process.dev
  }
}

export default defineNuxtPlugin(async (app) => {
  if (process.server) {
    await initRumServer(app)
  } else {
    await initRumClient()
  }
})
