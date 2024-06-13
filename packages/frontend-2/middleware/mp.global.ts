import { useMixpanel } from '~~/lib/core/composables/mp'

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
