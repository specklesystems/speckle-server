import { until } from '@vueuse/core'
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from '#vue-router'
import { buildManualPromise } from '@speckle/shared'

const useRouterNavigatingState = () =>
  useState('use_router_navigating_state', () => ({
    allActiveWaits: <Array<Promise<unknown>>>[]
  }))

/**
 * Global state that tells you if the router is in the middle of a navigation
 */
const useRouterNavigating = () => {
  const { $isNavigating } = useNuxtApp()
  const logger = useLogger()

  const state = useRouterNavigatingState()

  const waitUntilReady = async () => {
    try {
      // Wait for all queued up waits
      await Promise.allSettled(state.value.allActiveWaits)

      // Queue up another wait
      const waitPromise = buildManualPromise<void>()
      state.value.allActiveWaits = [...state.value.allActiveWaits, waitPromise.promise]

      // Invoke it
      const wait = async () => {
        try {
          await until($isNavigating).toBe(false, { throwOnTimeout: true, timeout: 500 })
        } finally {
          // clean up
          state.value.allActiveWaits = state.value.allActiveWaits.filter(
            (p) => p !== waitPromise.promise
          )
          waitPromise.resolve()
        }
      }
      await wait()
    } catch (e) {
      logger.warn(e, 'Wait for router ready failed w/ timeout')
    }
  }

  return {
    isNavigating: $isNavigating,
    /**
     * Wait for router to flush active navigations. Concurrent invocations will have ordered
     * execution guarantees.
     */
    waitUntilReady
  }
}

/**
 * Safely queues up navigation changes so that concurrent invocations don't interfere with each other and break navigation.
 * Useful in navigation-heavy environments like the Viewer.
 */
export const useSafeRouter = () => {
  const router = useRouter()
  const { waitUntilReady } = useRouterNavigating()

  const push = async (
    to: () => string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
  ) => {
    await waitUntilReady()
    return await router.push(to())
  }

  const replace = async (
    to: () => string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
  ) => {
    await waitUntilReady()
    return await router.replace(to())
  }

  return { ...router, push, replace }
}
