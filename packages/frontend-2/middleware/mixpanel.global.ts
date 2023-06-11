import { useMixpanel } from '~~/lib/core/composables/mp'

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return
  const mp = useMixpanel()
  const pathDefinition = to.matched[to.matched.length - 1].path
  const path = to.path
  mp.track('Route Visited', {
    path,
    pathDefinition
  })
})
