import mixpanel from 'mixpanel-browser'

export default defineNuxtPlugin(() => {
  const {
    public: { mixpanelApiHost, mixpanelTokenId }
  } = useRuntimeConfig()

  // Init
  mixpanel.init(mixpanelTokenId as string, {
    // eslint-disable-next-line camelcase
    api_host: mixpanelApiHost as string,
    debug: !!process.dev
  })

  return {
    provide: {
      mixpanel: () => mixpanel
    }
  }
})
