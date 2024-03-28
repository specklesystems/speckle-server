import type { RouteLocationNormalized } from 'vue-router'
import { noop } from 'lodash-es'
import { wrapRefWithTracking } from '~/lib/common/helpers/debugging'
import { ToastNotificationType } from '~~/lib/common/composables/toast'
// import { getRequestPath } from '~~/lib/core/helpers/observability'

/**
 * Debugging helper to ensure variables are available in debugging scope
 */
export const markUsed = noop

/**
 * Will attempt to resolve the current route definition in various ways.
 */
export const getRouteDefinition = (route?: RouteLocationNormalized) => {
  const matchedPath = route ? route.matched[route.matched.length - 1]?.path : undefined
  if (matchedPath) return matchedPath

  if (process.client) {
    // Just return from address bar
    return window.location.pathname
  } else {
    // Try to resolve from server event payload
    try {
      const nuxt = useNuxtApp()
      const ssrPath = nuxt.ssrContext?.event.path
      if (!ssrPath) throw new Error()

      return ssrPath
    } catch (e) {
      // Try-catch cause nuxt might not be available
      return 'unmatched-route-definition'
    }
  }
}

export { ToastNotificationType, wrapRefWithTracking }
