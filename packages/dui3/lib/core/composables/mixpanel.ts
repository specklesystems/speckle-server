import { md5 } from '@speckle/shared'
import type { OverridedMixpanel } from 'mixpanel-browser'
import { useHostAppStore } from '~/store/hostApp'
import { DUIAccount } from '~/store/accounts'

/**
 * Get Mixpanel instance
 * Note: Mixpanel is not available during SSR because mixpanel-browser only works in the browser!
 * If this composable is invoked during SSR it will return undefined!
 * But in DUI3 we do not have SSR.
 */
export function useMixpanel(): OverridedMixpanel {
  const app = useNuxtApp()
  const $mixpanel = app.$mixpanel as () => OverridedMixpanel
  return $mixpanel()
}

export function useMixpanelUserIdentification() {
  const mixpanel = useMixpanel()
  return {
    /**
     * Identify mixpanel user and server info with different account
     */
    reidentify: (account: DUIAccount) => {
      const hostApp = useHostAppStore()

      if (!account) {
        return
      }
      // Reset previous user data, if any
      mixpanel.reset()

      const serverId = md5(
        account?.accountInfo.serverInfo.url.toLowerCase() as string
      ).toUpperCase()

      // Register session
      mixpanel.register({
        // eslint-disable-next-line camelcase
        server_id: serverId,
        hostApp: hostApp.hostAppName,
        hostAppVersion: hostApp.hostAppVersion,
        // eslint-disable-next-line camelcase
        core_version: hostApp.connectorVersion
      })

      // Identify user, if any
      if (account?.accountInfo.id) {
        mixpanel.identify(account?.accountInfo.id)
        mixpanel.people.set('Identified', true)
      }
    }
  }
}
