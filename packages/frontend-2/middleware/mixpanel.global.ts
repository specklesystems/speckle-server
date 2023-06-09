import { useMixpanel } from '~~/lib/core/composables/mp'

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return
  const mixpanel = useMixpanel()
  const pathDefinition = to.matched[to.matched.length - 1].path
  const path = to.path
  mixpanel.track('Route Visited', {
    path,
    pathDefinition
  })
  console.log(path, pathDefinition)
})
