import { useMixpanel } from '~/lib/core/composables/mp'
import type { RouteLocationNormalized } from 'vue-router'
import type { Optional } from '@speckle/shared'

export default defineNuxtPlugin(() => {
  const mp = useMixpanel()
  const router = useRouter()
  const route = useRoute()

  let previousPath: Optional<string> = undefined
  const track = (to: RouteLocationNormalized) => {
    const path = to.path
    if (path === previousPath) return

    const pathDefinition = getRouteDefinition(to)
    mp.track('Route Visited', {
      path,
      pathDefinition
    })
    previousPath = path
  }

  // Track init page view
  track(route)

  // Track page view after navigations
  router.afterEach((to) => {
    track(to)
  })
})
