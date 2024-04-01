import md5 from '~/lib/common/helpers/md5'

interface CustomProperties {
  [key: string]: object | string
}

/**
 * Get Mixpanel instance
 * Note: Mixpanel is not available during SSR because mixpanel-browser only works in the browser!
 * If this composable is invoked during SSR it will return undefined!
 * But in DUI3 we do not have SSR.
 */
export function useMixpanel() {
  const isDevMode = ref(true)

  // TODO: Create here other versions of trackEvent functions that lacks account
  // const lastEmail = ref("")
  // const lastServer = ref("")

  async function trackEvent(
    email: string,
    server: string,
    eventName: string,
    customProperties: CustomProperties = {},
    isAction: boolean = true
  ) {
    const {
      public: { mixpanelApiHost, mixpanelTokenId }
    } = useRuntimeConfig()

    // TODO: enable it later somehow
    //if (isDevMode.value) {
    //  // Only track in production
    //  return
    //}

    try {
      const hashedEmail = md5(email.toLowerCase() as string).toUpperCase()
      const hashedServer = md5(server.toLowerCase() as string).toUpperCase()
      console.log(hashedEmail, 'hashedEmail')
      console.log(hashedServer, 'hashedServer')

      // Merge base properties with custom ones
      const properties = {
        // eslint-disable-next-line camelcase
        distinct_id: hashedEmail,
        // eslint-disable-next-line camelcase
        server_id: hashedServer,
        token: mixpanelTokenId as string,
        type: isAction ? 'action' : undefined,
        ...customProperties
      }

      const eventData = {
        event: eventName.toString(),
        properties
      }

      const encodedData = btoa(JSON.stringify(eventData))
      console.log(encodedData, 'encodedData')

      const response = await fetch(
        `${mixpanelApiHost as string}/track?ip=1&_=${Date.now()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${encodedData}`
        }
      )
      console.log(response, 'response')

      if (!response.ok) {
        throw new Error(`Analytics event failed: ${response.statusText}`)
      }
    } catch (error) {
      console.warn('Failed to track event in MixPanel:', error)
      // Handle error or logging
    }
  }

  return { trackEvent }
}
