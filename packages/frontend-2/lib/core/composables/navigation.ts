import type { FetchPolicy } from '@apollo/client/core'
import type { RouteLocationNormalized } from 'vue-router'

export const useMiddlewareQueryFetchPolicy = () => {
  return (to: RouteLocationNormalized, from?: RouteLocationNormalized): FetchPolicy => {
    if (import.meta.server) return 'cache-first'

    const isInPlace = checkIfIsInPlaceNavigation(to, from)
    if (isInPlace) {
      return 'cache-first'
    }

    // If initial page load on CSR side, we want to rely on SSR data
    if (!from && import.meta.client) {
      return 'cache-first'
    }

    // Real CSR navigation
    return 'network-only'
  }
}
