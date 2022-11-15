import type { OverridedMixpanel } from 'mixpanel-browser'
import { getCurrentInstance } from 'vue'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
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
 */
export function useMixpanel(): () => OverridedMixpanel {
  const vm = getCurrentInstance()
  const proxy = vm?.proxy
  if (!proxy) throw new ComposableInvokedOutOfScopeError()

  return proxy.$mixpanel
}

/**
 * Composable that builds the user (re-)identification function. Needs to be invoked on app
 * init and when the active user changes (e.g. after signing out/in)
 * Note: The returned function will only work on the client-side
 */
export function useMixpanelUserIdentification() {
  if (process.server) return () => void 0

  const mixpanelBuilder = useMixpanel()
  const { distinctId } = useActiveUser()
  const { isDarkTheme } = useTheme()

  return () => {
    const mp = mixpanelBuilder()

    // Reset previous user data, if any
    mp.reset()

    // Register session
    mp.register({
      // eslint-disable-next-line camelcase
      server_id: getMixpanelServerId(),
      hostApp: HOST_APP
    })

    // TODO: This doesn't work properly, we need to fix Apollo queries getting stuck first...
    // Identify user, if any
    if (distinctId.value) {
      mp.identify(distinctId.value)
      mp.people.set('Identified', true)
      mp.people.set('Theme Web', isDarkTheme.value ? 'dark' : 'light')
    }
  }
}

/**
 * Composable that builds the mixpanel initialization function
 * Note: The returned function will only initialize mixpanel on the client-side
 */
export function useMixpanelInitialization() {
  if (process.server) return () => void 0

  const mixpanelBuilder = useMixpanel()
  const identifyUser = useMixpanelUserIdentification()

  return () => {
    const mp = mixpanelBuilder()

    // Identify user
    identifyUser()

    // Track app visit
    mp.track(`Visit ${HOST_APP_DISPLAY_NAME}`)
  }
}
