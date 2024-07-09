import { useMixpanel } from '~~/lib/core/composables/mp'

/**
 * TODO: This should be a plugin w/ route.after() hooks, cause what if another middleware cancels the navigation after this?
 */

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  const mp = useMixpanel()
  const pathDefinition = getRouteDefinition(to)
  const path = to.path
  mp.track('Route Visited', {
    path,
    pathDefinition
  })
})
