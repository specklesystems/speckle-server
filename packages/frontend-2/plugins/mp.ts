/**
 * mixpanel-browser only supports being ran on the client-side (hence the name)! So it's only going to be accessible
 * in client-side execution branches
 */

export default defineNuxtPlugin(async () => {
  const {
    public: { mixpanelApiHost, mixpanelTokenId }
  } = useRuntimeConfig()

  const mixpanel = process.client
    ? (await import('mixpanel-browser')).default
    : undefined
  if (!mixpanel) {
    return {
      provide: {
        mixpanel: () => {
          throw new Error('Mixpanel is only available on the client-side!')
        }
      }
    }
  }

  // Init
  // TODO: Separate token for new frontend?
  mixpanel.init(mixpanelTokenId, {
    // eslint-disable-next-line camelcase
    api_host: mixpanelApiHost
  })

  return {
    provide: {
      mixpanel: () => mixpanel
    }
  }
})
