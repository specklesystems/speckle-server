import { until } from '@vueuse/core'
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from '#vue-router'
import { buildManualPromise } from '@speckle/shared'

const useRouterNavigatingState = () =>
  useState('use_router_navigating_state', () => ({
    allActiveWaits: <Array<Promise<unknown>>>[],
    /**
     * Used for debugging to assign an incrementing id to each invocation
     */
    logId: 0
  }))

const useRouterNavigatingDevUtils = () => {
  const state = useRouterNavigatingState()
  const { $debugRoutes, $isNavigating, $logger } = useNuxtApp()

  const ret = {
    getLogId: () => {
      const newVal = state.value.logId + 1
      state.value.logId = newVal

      return newVal + ''
    },
    ifDebugRoutes: (fn: () => void) => {
      if ($debugRoutes) {
        fn()
      }
    },
    debugLog: (...args: unknown[]) => {
      ret.ifDebugRoutes(() => {
        devTrace(...args)
      })
    },
    isNuxtNavigating: $isNavigating,
    logger: $logger
  }

  return ret
}

/**
 * Safely queues up navigation changes so that concurrent invocations don't interfere with each other and break navigation.
 * Useful in navigation-heavy environments like the Viewer.
 *
 * Supports debugRoutes=1 query param for debug logs
 */
export const useSafeRouter = () => {
  const { getLogId, debugLog, isNuxtNavigating, logger } = useRouterNavigatingDevUtils()
  const router = useRouter()
  const state = useRouterNavigatingState()

  // const { waitUntilReady } = useRouterNavigating()

  const pushOrReplace = async (
    to: () => string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric,
    action: 'push' | 'replace'
  ) => {
    // We want to add new promise to queue ASAP to avoid race conditions when 2 invocations
    // occur very close to each other. Basically we have to queue it up before we do any async
    // actions inside
    const waitPromise = buildManualPromise<void>()
    const logId = getLogId()

    const waitForNavigationsClear = async () =>
      await until(isNuxtNavigating)
        .toBe(false, {
          throwOnTimeout: true,
          timeout: 500
        })
        .catch((err) => {
          // Swallow throw, just log and continue
          logger.error({ err }, 'Waiting for nuxt navigations to clear timed out')
        })

    debugLog(`[{logId}] Safe router ${action} registered`, {
      initialTo: to(),
      logId
    })

    try {
      const activeWaits = state.value.allActiveWaits.slice()

      // Queue up another wait
      state.value.allActiveWaits = [...state.value.allActiveWaits, waitPromise.promise]

      // Wait for all previously queued up waits
      await Promise.allSettled(activeWaits)

      debugLog(
        '[{logId}] All active waits awaited, lets wait for navigations to clear generally...',
        {
          logId,
          activeWaits
        }
      )
      await waitForNavigationsClear()

      const finalTo = to()
      debugLog(
        `[{logId}] Safe router ${action} ready, firing and waiting for clear...`,
        {
          finalTo,
          logId
        }
      )

      const navResult = await router[action](finalTo)
      await waitForNavigationsClear()

      // Resolve and clean up
      debugLog(`[{logId}] Navigation finished and cleared!`, {
        finalTo,
        logId,
        navResult
      })
      state.value.allActiveWaits = state.value.allActiveWaits.filter(
        (p) => p !== waitPromise.promise
      )
      waitPromise.resolve()

      return navResult
    } catch (e) {
      waitPromise.reject(e)
      throw e
    } finally {
      state.value.allActiveWaits = state.value.allActiveWaits.filter(
        (p) => p !== waitPromise.promise
      )
    }
  }

  const push = async (
    to: () => string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
  ) => {
    return await pushOrReplace(to, 'push')
  }

  const replace = async (
    to: () => string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
  ) => {
    return await pushOrReplace(to, 'replace')
  }

  return { ...router, push, replace }
}
