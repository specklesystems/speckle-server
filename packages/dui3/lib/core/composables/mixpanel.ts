import md5 from '~/lib/common/helpers/md5'
import { useHostAppStore } from '~/store/hostApp'
import { useAccountStore } from '~/store/accounts'

interface CustomProperties {
  [key: string]: object | string | boolean | number | undefined | null
}

// Cached email and server
const lastEmail: Ref<string | undefined> = ref(undefined)
const lastServer: Ref<string | undefined> = ref(undefined)

/**
 * Get Mixpanel functions
 * In DUI3, quite likely to change distinct id of the track operation since we can trigger repetitive calls that belongs to different account.
 * Also we have some operations that explicitly not belong to any account, i.e. first "Send" or "Load" click,
 * with this case we use default account on manager to get "email" and "server" and cache them for later anonymous track.
 * In each call we update "lastEmail" and "lastServer" for the following potential anonymous tracks.
 */
export function useMixpanel() {
  const hostApp = useHostAppStore()
  const {
    public: { mixpanelApiHost, mixpanelTokenId }
  } = useRuntimeConfig()

  /**
   * Track event for mixpanel which do HTTP request to end point.
   * @param eventName Event name.
   * @param customProperties custom properties that will be attached to the properties of track event.
   * @param accountId account id to track with id. It will populate hashed "distinct_id" from email and "server_id" from url.
   * @param isAction whether event is action or not.
   */
  async function trackEvent(
    eventName: string,
    customProperties: CustomProperties = {},
    accountId?: string,
    isAction: boolean = true
  ) {
    const { activeAccount, accounts } = useAccountStore()

    if (accountId) {
      const account = accounts.find((a) => a.accountInfo.id === accountId)
      lastEmail.value = account?.accountInfo.userInfo.email
      lastServer.value = account?.accountInfo.serverInfo.url
    } else {
      // do not set if they cached already
      if (lastEmail.value === undefined || lastServer.value === undefined) {
        lastEmail.value = activeAccount.accountInfo.userInfo.email
        lastServer.value = activeAccount.accountInfo.serverInfo.url
      }
    }

    // TODO: enable it later somehow
    // if (process.dev) {
    //   // Only track in production
    //   return
    // }

    try {
      if (!lastEmail.value || !lastServer.value) {
        throw new Error('Email or server not found to track event.')
      }
      const hashedEmail =
        '@' + md5(lastEmail.value.toLowerCase() as string).toUpperCase()
      const hashedServer = md5(
        new URL(lastServer.value).hostname.toLowerCase() as string
      ).toUpperCase()

      // Get os info from userAgent text
      // taken from original mixpanel implementation
      // https://github.com/mixpanel/mixpanel-js/blob/master/examples/commonjs-browserify/bundle.js#L1576
      const userAgent = navigator.userAgent
      let os = 'unknown'
      if (/Windows/i.test(userAgent)) {
        os = 'Windows'
      } else if (/Mac/i.test(userAgent)) {
        os = 'Mac OS X'
      }

      // Merge base properties with custom ones
      const properties = {
        $os: os,
        // eslint-disable-next-line camelcase
        distinct_id: hashedEmail,
        // eslint-disable-next-line camelcase
        server_id: hashedServer,
        token: mixpanelTokenId as string,
        type: isAction ? 'action' : undefined,
        hostApp: hostApp.hostAppName,
        hostAppVersion: hostApp.hostAppVersion as string,
        ui: 'dui3', // Not sure about this but we need to put something to distiguish some events, like "Send", "Receive", alternatively we can have "SendDUI3" not sure!
        // eslint-disable-next-line camelcase
        core_version: hostApp.connectorVersion,
        email: lastEmail,
        ...customProperties
      }

      const eventData = {
        event: eventName.toString(),
        properties
      }

      if (import.meta.dev) {
        console.info('Mixpanel event', eventData)
      }

      const response = await fetch(
        `${mixpanelApiHost as string}/track?ip=1&_=${Date.now()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${btoa(JSON.stringify(eventData))}`
        }
      )

      if (!response.ok) {
        throw new Error(`Analytics event failed: ${response.statusText}`)
      }
    } catch (error) {
      // Handle error or logging
      console.warn('Failed to track event in MixPanel:', error)
    }
  }

  async function addConnectorToProfile(email: string) {
    try {
      const hashedEmail = '@' + md5(email.toLowerCase() as string).toUpperCase()

      const eventData = {
        // eslint-disable-next-line camelcase
        $distinct_id: hashedEmail,
        $token: mixpanelTokenId as string,
        $union: {
          Connectors: [hostApp.hostAppName]
        }
      }

      const response = await fetch(
        `${mixpanelApiHost as string}/engage#profile-union`,
        {
          method: 'POST',
          headers: {
            accept: 'text/plain',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${btoa(JSON.stringify(eventData))}`
        }
      )
      if (!response.ok) {
        throw new Error(`Analytics event failed: ${response.statusText}`)
      }
    } catch (error) {
      // Handle error or logging
      console.warn('Failed to track event in MixPanel:', error)
    }
  }

  async function identifyProfile(email: string) {
    try {
      const hashedEmail = '@' + md5(email.toLowerCase() as string).toUpperCase()

      const eventData = {
        // eslint-disable-next-line camelcase
        $distinct_id: hashedEmail,
        $token: mixpanelTokenId as string,
        $set: {
          Identified: true,
          email
        }
      }

      const response = await fetch(`${mixpanelApiHost as string}/engage#profile-set`, {
        method: 'POST',
        headers: {
          accept: 'text/plain',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${btoa(JSON.stringify(eventData))}`
      })
      if (!response.ok) {
        throw new Error(`Analytics event failed: ${response.statusText}`)
      }
    } catch (error) {
      // Handle error or logging
      console.warn('Failed to track event in MixPanel:', error)
    }
  }

  return { trackEvent, addConnectorToProfile, identifyProfile }
}
