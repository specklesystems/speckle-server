import { until } from '@vueuse/core'

/**
 * Global state that tells you if the router is in the middle of a navigation
 */
export const useRouterNavigating = () => {
  const { $isNavigating } = useNuxtApp()
  const logger = useLogger()

  const waitUntilReady = async () => {
    try {
      await until($isNavigating).toBe(false, { throwOnTimeout: true, timeout: 500 })
    } catch (e) {
      logger.warn(e, 'Wait for router ready failed w/ timeout')
    }
  }

  return {
    isNavigating: $isNavigating,
    /**
     * Wait for router to flush active navigations
     */
    waitUntilReady
  }
}
