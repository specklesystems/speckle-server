import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useCreateErrorLoggingTransport } from '~/lib/core/composables/error'

async function initRumClient() {
  const { enabled, keys, speckleServerVersion } = resolveInitParams()
  const onAuthStateChange = useOnAuthStateChange()
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
    })
  }
}

async function initRumServer() {
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
}

function resolveInitParams() {
  const {
    public: { raygunKey, logrocketAppId, speckleServerVersion }
  } = useRuntimeConfig()
  const raygun = raygunKey?.length ? raygunKey : null
  const logrocket = logrocketAppId?.length ? logrocketAppId : null
  const enabled = !!(raygun || logrocket)

  return {
    enabled,
    keys: {
      raygun,
      logrocket
    },
    speckleServerVersion
  }
}

export default defineNuxtPlugin(async () => {
  if (process.server) {
    await initRumServer()
  } else {
    await initRumClient()
  }
})
