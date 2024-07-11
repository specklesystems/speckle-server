import { useMixpanel } from '~/lib/core/composables/mp'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtPlugin(() => {
  const mp = useMixpanel()
  const router = useRouter()
  const route = useRoute()

  const track = (to: RouteLocationNormalized) => {
    const pathDefinition = getRouteDefinition(to)
    const path = to.path
    mp.track('Route Visited', {
      path,
      pathDefinition
    })
  }

  // Track init page view
  track(route)

  // Track page view after navigations
  router.afterEach((to) => {
    track(to)
  })
})
