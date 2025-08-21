import { until } from '@vueuse/core'

/**
 * Global state for if vue-router is in a pending navigation
 * (helps avoid race conditions in environments w/ many concurrent navigations like the viewer)
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  const route = useRoute()
  const logger = useLogger()

  const isNavigating = ref(false)

  // Only drive on client
  if (import.meta.client) {
    router.beforeEach(() => {
      isNavigating.value = true
    })
    router.afterEach(async (to) => {
      const newPath = to.fullPath

      try {
        await until(() => route.fullPath === newPath).toBeTruthy({
          timeout: 500,
          throwOnTimeout: true
        })
      } catch (e) {
        logger.warn(e, 'Waiting for navigation to finalize failed')
      }

      isNavigating.value = false
    })
    router.onError(() => {
      isNavigating.value = false
    })
  }

  return {
    provide: {
      isNavigating: computed(() => isNavigating.value)
    }
  }
})
