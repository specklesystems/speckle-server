/**
 * Get Mixpanel instance
 */
export function useMixpanel() {
  const nuxt = useNuxtApp()
  const $mixpanel = nuxt.$mixpanel
  return $mixpanel()
}

/**
 * Get Mixpanel instance on demand. Useful in early app bootstrapping situations where mixpanel may not be
 * immediately available
 */
export const useDeferredMixpanel = () => {
  const nuxt = useNuxtApp()
  return () => {
    const $mixpanel = nuxt.$mixpanel
    if (!$mixpanel) return undefined
    return $mixpanel()
  }
}
