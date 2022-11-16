import type { OverridedMixpanel } from 'mixpanel-browser'
import { getCurrentInstance } from 'vue'
import { useActiveUser, useWaitForActiveUser } from '~~/lib/auth/composables/activeUser'
import md5 from '~~/lib/common/helpers/md5'
import { ComposableInvokedOutOfScopeError } from '~~/lib/core/errors/base'
import { useTheme } from '~~/lib/core/composables/theme'

const HOST_APP = 'web-2'
const HOST_APP_DISPLAY_NAME = 'Web 2.0 App'

/**
 * Get mixpanel server identifier
 */
function getMixpanelServerId(): string {
  return md5(window.location.hostname.toLowerCase()).toUpperCase()
}

/**
 * Get Mixpanel instance
 * Note: Mixpanel is not available during SSR because mixpanel-browser only works in the browser!
 * If this composable is invoked during SSR it will return undefined!
 */
export function useMixpanel(): OverridedMixpanel {
  // we're making TS lie here cause we don't want to constantly check if the return of this
  // is undefined
  if (process.server) return undefined as unknown as OverridedMixpanel

  const vm = getCurrentInstance()
  const proxy = vm?.proxy
  if (!proxy) throw new ComposableInvokedOutOfScopeError()

  return proxy.$mixpanel()
}

/**
 * Composable that builds the user (re-)identification function. Needs to be invoked on app
 * init and when the active user changes (e.g. after signing out/in)
 * Note: The returned function will only work on the client-side
 */
export function useMixpanelUserIdentification() {
  if (process.server) return { reidentify: () => void 0 }

  const mp = useMixpanel()
  const { distinctId } = useActiveUser()
  const { isDarkTheme } = useTheme()

  return {
    reidentify: () => {
      // Reset previous user data, if any
      mp.reset()

      // Register session
      mp.register({
        // eslint-disable-next-line camelcase
        server_id: getMixpanelServerId(),
        hostApp: HOST_APP
      })

      // Identify user, if any
      if (distinctId.value) {
        mp.identify(distinctId.value)
        mp.people.set('Identified', true)
        mp.people.set('Theme Web', isDarkTheme.value ? 'dark' : 'light')
      }
    }
  }
}

/**
 * Composable that builds the mixpanel initialization function
 * Note: The returned function will only initialize mixpanel on the client-side
 */
export async function useMixpanelInitialization() {
  if (process.server) return

  const mp = useMixpanel()
  const { reidentify } = useMixpanelUserIdentification()

  await useWaitForActiveUser()

  reidentify()

  // Track app visit
  mp.track(`Visit ${HOST_APP_DISPLAY_NAME}`)
}
