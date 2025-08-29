import { until } from '@vueuse/core'
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from '#vue-router'
import { buildManualPromise } from '@speckle/shared'
import { useScopedState } from '~/lib/common/composables/scopedState'

const useRouterNavigatingState = () =>
  useScopedState('use_router_navigating_state', () => ({
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
      const newVal = state.logId + 1
      state.logId = newVal

      return newVal + ''
    },
    ifDebugRoutes: (fn: () => void) => {
      if ($debugRoutes) {
        fn()
      }
    },
    debugLog: (...args: unknown[]) => {
      ret.ifDebugRoutes(() => {
        devLog(...args)
      })
    },
    debugTrace: (...args: unknown[]) => {
      ret.ifDebugRoutes(() => {
        devTrace(...args)
      })
    },
    waitForNavigationsClear: async () =>
      await until($isNavigating)
        .toBe(false, {
          throwOnTimeout: true,
          timeout: 500
        })
        .catch((err) => {
          // Swallow throw, just log and continue
          $logger.error({ err }, 'Waiting for nuxt navigations to clear timed out')
        }),
    isNuxtNavigating: $isNavigating,
    logger: $logger
  }

  return ret
}

type SafeRouterNavigationTarget =
  | string
  | RouteLocationAsRelativeGeneric
  | RouteLocationAsPathGeneric

type SafeRouterNavigationOptions<
  Target extends SafeRouterNavigationTarget = SafeRouterNavigationTarget
> = Partial<{
  /**
   * When router finally gets to fire, optionally do an extra check to see if you
   * want to cancel the navigation instead
   */
  skipIf?: (target: Target) => boolean
}>

/**
 * Safely queues up navigation changes so that concurrent invocations don't interfere with each other and break navigation.
 * Useful in navigation-heavy environments like the Viewer.
 *
 * Supports debugRoutes=1 query param for debug logs
 */
export const useSafeRouter = () => {
  const { getLogId, debugLog, debugTrace, waitForNavigationsClear } =
    useRouterNavigatingDevUtils()
  const router = useRouter()
  const state = useRouterNavigatingState()

  const pushOrReplace = async <
    Target extends SafeRouterNavigationTarget = SafeRouterNavigationTarget
  >(
    to: () => Target,
    action: 'push' | 'replace',
    options?: SafeRouterNavigationOptions<Target>
  ) => {
    // We want to add new promise to queue ASAP to avoid race conditions when 2 invocations
    // occur very close to each other. Basically we have to queue it up before we do any async
    // actions inside
    const waitPromise = buildManualPromise<void>()
    const logId = getLogId()

    debugTrace(`[{logId}] Safe router ${action} registered`, {
      initialTo: to(),
      logId
    })

    try {
      const activeWaits = state.allActiveWaits.slice()

      // Queue up another wait
      state.allActiveWaits = [...state.allActiveWaits, waitPromise.promise]

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

      if (options?.skipIf && options?.skipIf(finalTo)) {
        debugLog(
          `[{logId}] Safe router ${action} ready, but skipped due to skipIf...`,
          {
            logId
          }
        )
        waitPromise.resolve()
        return undefined
      }

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
      state.allActiveWaits = state.allActiveWaits.filter(
        (p) => p !== waitPromise.promise
      )
      waitPromise.resolve()

      return navResult
    } catch (e) {
      waitPromise.reject(e)
      throw e
    } finally {
      state.allActiveWaits = state.allActiveWaits.filter(
        (p) => p !== waitPromise.promise
      )
    }
  }

  const push = async <
    Target extends SafeRouterNavigationTarget = SafeRouterNavigationTarget
  >(
    to: () => Target,
    options?: SafeRouterNavigationOptions<Target>
  ) => {
    return await pushOrReplace(to, 'push', options)
  }

  const replace = async <
    Target extends SafeRouterNavigationTarget = SafeRouterNavigationTarget
  >(
    to: () => Target,
    options?: SafeRouterNavigationOptions<Target>
  ) => {
    return await pushOrReplace(to, 'replace', options)
  }

  return { ...router, push, replace }
}

/**
 * Similar to useRoute, but will not change the value until the new/incoming route has fully finished navigating
 */
export const useCurrentRouteTillNavigated = () => {
  const baseRoute = useRoute()
  const { $isNavigating } = useNuxtApp()
  const route = shallowRef({ ...toRaw(baseRoute) })

  watch($isNavigating, (newVal, oldVal) => {
    if (!newVal && oldVal) {
      route.value = { ...toRaw(baseRoute) }
    }
  })

  return route
}
