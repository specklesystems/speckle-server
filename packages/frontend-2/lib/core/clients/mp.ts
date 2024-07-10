/* eslint-disable camelcase */
import { type Nullable, resolveMixpanelServerId } from '@speckle/shared'
import mixpanel from 'mixpanel-browser'
import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import {
  HOST_APP,
  HOST_APP_DISPLAY_NAME,
  type MixpanelClient
} from '~/lib/common/helpers/mp'
import { useTheme } from '~/lib/core/composables/theme'

/**
 * Get mixpanel server identifier
 */
function getMixpanelServerId(): string {
  return resolveMixpanelServerId(window.location.hostname)
}

/**
 * Composable that builds the user (re-)identification function. Needs to be invoked on app
 * init and when the active user changes (e.g. after signing out/in)
 * Note: The returned function will only work on the client-side
 */
function useMixpanelUserIdentification() {
  if (import.meta.server) return { reidentify: () => void 0 }

  const { distinctId } = useActiveUser()
  const { isDarkTheme } = useTheme()
  const serverId = getMixpanelServerId()
  const {
    public: { speckleServerVersion }
  } = useRuntimeConfig()

  return {
    reidentify: (mp: MixpanelClient) => {
      // Reset previous user data, if any
      mp.reset()

      // Register session
      mp.register({
        server_id: serverId,
        hostApp: HOST_APP,
        speckleVersion: speckleServerVersion
      })

      // Identify user, if any
      if (distinctId.value) {
        mp.identify(distinctId.value)
        mp.people.set('Identified', true)
        mp.people.set('Theme Web', isDarkTheme.value ? 'dark' : 'light')
        mp.add_group('server_id', serverId)
      }
    }
  }
}

export const useClientsideMixpanelClientBuilder = () => {
  const {
    public: { mixpanelApiHost, mixpanelTokenId, logCsrEmitProps }
  } = useRuntimeConfig()
  const { reidentify } = useMixpanelUserIdentification()
  const onAuthStateChange = useOnAuthStateChange()

  return async (): Promise<Nullable<MixpanelClient>> => {
    if (!mixpanel || !mixpanelTokenId.length || !mixpanelApiHost.length) {
      return null
    }

    // Init
    mixpanel.init(mixpanelTokenId, {
      api_host: mixpanelApiHost,
      debug: !!import.meta.dev && logCsrEmitProps
    })

    // Reidentify on auth change
    await onAuthStateChange(() => reidentify(mixpanel), { immediate: true })

    // Track app visit
    mixpanel.track(`Visit ${HOST_APP_DISPLAY_NAME}`)

    return mixpanel
  }
}
