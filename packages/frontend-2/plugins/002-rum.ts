import type { Plugin } from '#app'
import { ensureError } from '@speckle/shared'
import { isString } from 'lodash-es'
import { useOnAuthStateChange } from '~/lib/auth/composables/auth'

type PluginNuxtApp = Parameters<Plugin>[0]

async function initRumClient(params: { nuxtApp: PluginNuxtApp }) {
  const {
    enabled,
    keys: { raygunKey }
  } = resolveInitParams()
  const { nuxtApp } = params
  const onAuthStateChange = useOnAuthStateChange()
  if (!enabled) return

  // RayGun
  if (raygunKey) {
    const rg4js = (await import('raygun4js')).default
    rg4js('apiKey', raygunKey)
    rg4js('enableCrashReporting', true)
    rg4js('boot')
    rg4js('enableRum', true)

    // TODO: Add to seq logger, instead of doing these manually

    nuxtApp.vueApp.config.errorHandler = (err, vm, info) => {
      rg4js('send', {
        error: err,
        customData: {
          info
        }
      })
    }

    onAuthStateChange(
      (user, { resolveDistinctId }) => {
        const distinctId = resolveDistinctId(user)
        rg4js('setUser', {
          identifier: distinctId || '',
          isAnonymous: !distinctId
        })
      },
      { immediate: true }
    )
  }
}

async function initRumServer(params: { nuxtApp: PluginNuxtApp }) {
  const {
    enabled,
    keys: { raygunKey }
  } = resolveInitParams()
  const { nuxtApp } = params
  if (!enabled) return

  // RayGun
  if (raygunKey) {
    const raygun = (await import('raygun')).default
    const raygunClient = new raygun.Client().init({
      apiKey: raygunKey,
      batch: true,
      reportUncaughtExceptions: true
    })

    nuxtApp.hook('vue:error', (error) => {
      raygunClient.send(isString(error) ? error : ensureError(error))
    })

    nuxtApp.hook('app:error', (error) => {
      raygunClient.send(isString(error) ? error : ensureError(error))
    })
  }
}

function resolveInitParams() {
  const {
    public: { raygunKey }
  } = useRuntimeConfig()
  const enableRum = raygunKey?.length > 0

  return {
    enabled: enableRum,
    keys: {
      raygunKey: raygunKey?.length ? raygunKey : null
    }
  }
}

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.server) {
    await initRumServer({ nuxtApp })
  } else {
    await initRumClient({ nuxtApp })
  }
})
