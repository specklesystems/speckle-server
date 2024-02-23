import type { Plugin } from 'nuxt/dist/app/nuxt'
import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useCreateErrorLoggingTransport } from '~/lib/core/composables/error'

type PluginNuxtApp = Parameters<Plugin>[0]

async function initRumClient(app: PluginNuxtApp) {
  const { enabled, keys, speckleServerVersion } = resolveInitParams()
  const logger = useLogger()
  const onAuthStateChange = useOnAuthStateChange()
  const router = useRouter()
  const registerErrorTransport = useCreateErrorLoggingTransport()
  if (!enabled) return

  // RayGun
  if (keys.raygun) {
    const rg4js = (await import('raygun4js')).default
    rg4js('apiKey', keys.raygun)
    rg4js('enableCrashReporting', true)
    rg4js('enablePulse', true)
    rg4js('boot')
    rg4js('enableRum', true)

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

  // LogRocket
  if (keys.logrocket) {
    const logrocket = (await import('logrocket')).default
    logrocket.init(keys.logrocket, {
      release: speckleServerVersion,
      console: {
        isEnabled: false // Log manually, prevent console shim
      }
    })

    await onAuthStateChange(
      (user, { resolveDistinctId }) => {
        const distinctId = resolveDistinctId(user)
        logrocket.identify(distinctId || '')
      },
      { immediate: true }
    )

    registerErrorTransport({
      onError: ({ firstError, firstString, otherData, nonObjectOtherData }) => {
        const error = firstError || firstString || 'Unknown error'
        logrocket.error(error, {
          ...otherData,
          extraData: nonObjectOtherData,
          mainErrorMessage: firstString
        })
      }
      // Unhandleds auto-tracked by LogRocket
      // onUnhandledError
    })
  }

  // Speedcurve
  if (keys.speedcurve) {
    // On page transition init, call LUX.init()
    let pendingRouting = false
    router.beforeEach((to, from) => {
      if (to.fullPath !== from.fullPath) {
        pendingRouting = true
        window.LUX.init()
        if (process.dev) logger.debug('RUM: LUX.init()')
      }
    })

    app.hook('page:finish', () => {
      // Unfortunately there's no accurate hook for handling the moment when the new page has fully mounted, title updated etc.
      // So setTimeout it is, here we go ;(
      setTimeout(() => {
        if (pendingRouting) {
          pendingRouting = false
          window.LUX.send()
          if (process.dev) logger.debug('RUM: LUX.send()')
        }
      }, 50)
    })
  }
}

async function initRumServer(app: PluginNuxtApp) {
  const registerErrorTransport = useCreateErrorLoggingTransport()
  const { enabled, keys } = resolveInitParams()
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
  }

  // Speedcurve - attach JS
  if (keys.speedcurve) {
    app.hook('app:rendered', (context) => {
      context.ssrContext!.head.push({
        script: [
          {
            innerHTML: `LUX=function(){function n(){return Date.now?Date.now():+new Date}var r,e=n(),t=window.performance||{},a=t.timing||{navigationStart:(null===(r=window.LUX)||void 0===r?void 0:r.ns)||e};function o(){return t.now?(r=t.now(),Math.floor(r)):n()-a.navigationStart;var r}(LUX=window.LUX||{}).ac=[],LUX.addData=function(n,r){return LUX.cmd(["addData",n,r])},LUX.cmd=function(n){return LUX.ac.push(n)},LUX.getDebug=function(){return[[e,0,[]]]},LUX.init=function(){return LUX.cmd(["init"])},LUX.mark=function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];if(t.mark)return t.mark.apply(t,n);var e=n[0],a=n[1]||{};void 0===a.startTime&&(a.startTime=o());LUX.cmd(["mark",e,a])},LUX.markLoadTime=function(){return LUX.cmd(["markLoadTime",o()])},LUX.measure=function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];if(t.measure)return t.measure.apply(t,n);var e,a=n[0],i=n[1],u=n[2];e="object"==typeof i?n[1]:{start:i,end:u};e.duration||e.end||(e.end=o());LUX.cmd(["measure",a,e])},LUX.send=function(){return LUX.cmd(["send"])},LUX.ns=e;var i=LUX;if(window.LUX_ae=[],window.addEventListener("error",(function(n){window.LUX_ae.push(n)})),window.LUX_al=[],"function"==typeof PerformanceObserver&&"function"==typeof PerformanceLongTaskTiming){var u=new PerformanceObserver((function(n){for(var r=n.getEntries(),e=0;e<r.length;e++)window.LUX_al.push(r[e])}));try{u.observe({type:"longtask"})}catch(n){}}return i}();`
          },
          {
            src: `https://cdn.speedcurve.com/js/lux.js?id=${keys.speedcurve?.toString()}`,
            async: true,
            defer: true,
            crossorigin: 'anonymous',
            ...(process.dev ? { onload: 'LUX.forceSample()' } : {})
          }
        ]
      })
    })
  }

  // DebugBear - attach JS
  if (keys.debugbear) {
    app.hook('app:rendered', (context) => {
      context.ssrContext!.head.push({
        script: [
          {
            src: `https://cdn.debugbear.com/${keys.debugbear || ''}.js`,
            async: true
          }
        ]
      })
    })
  }
}

function resolveInitParams() {
  const {
    public: {
      raygunKey,
      logrocketAppId,
      speckleServerVersion,
      speedcurveId,
      debugbearId
    }
  } = useRuntimeConfig()
  const raygun = raygunKey?.length ? raygunKey : null
  const logrocket = logrocketAppId?.length ? logrocketAppId : null
  const speedcurve = speedcurveId ? speedcurveId : null
  const debugbear = debugbearId?.length ? debugbearId : null
  const enabled = !!(raygun || logrocket || speedcurve || debugbear)

  return {
    enabled,
    keys: {
      raygun,
      logrocket,
      speedcurve,
      debugbear
    },
    speckleServerVersion
  }
}

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.server) {
    await initRumServer(nuxtApp)
  } else {
    await initRumClient(nuxtApp)
  }
})
