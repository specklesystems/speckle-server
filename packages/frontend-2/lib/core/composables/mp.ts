/**
 * Get Mixpanel instance
 * Note: Mixpanel is not available during SSR because mixpanel-browser only works in the browser!
 */
export function useMixpanel() {
  const nuxt = useNuxtApp()
  const $mixpanel = nuxt.$mixpanel
  return $mixpanel()
}
