import { reduce } from 'lodash-es'
import { Nullable, Optional } from '@speckle/shared'
import { createControllablePromise } from '~~/lib/common/helpers/promise'
import type { RouteLocationRaw, RouteLocationNormalizedLoaded } from 'vue-router'
import { useScopedState } from '~~/lib/common/composables/scopedState'

type PushParameters = [
  RouteLocationRaw | ((route: RouteLocationNormalizedLoaded) => RouteLocationRaw)
]

export const useQueuedRoutingState = () =>
  useScopedState('useQueuedRouting', () => ({
    queuedCalls: ref(
      [] as Array<{
        args: PushParameters
        res: ReturnType<
          typeof createControllablePromise<
            Awaited<ReturnType<ReturnType<typeof useRouter>['push']>>
          >
        >
      }>
    ),
    processingPromise: ref(null as Nullable<Promise<unknown>>)
  }))

/**
 * In complex scenarios when there are possibly multiple concurrent router.push() calls occurring (e.g.
 * updating the hash state and in another place updating params) the router seems to break.
 * To get around this you can use this composable to queue router.push() calls in such a way
 * that they will always be invoked serially.
 *
 * You can use function parameter for push() if you want to get access to the value of useRoute() at the
 * time when the push call actually finally gets invoked
 */
export function useQueuedRouting() {
  const { queuedCalls } = useQueuedRoutingState()

  const push = async (...args: PushParameters) => {
    const res =
      createControllablePromise<
        Awaited<ReturnType<ReturnType<typeof useRouter>['push']>>
      >()
    queuedCalls.value = [...queuedCalls.value, { args, res }]
    return await res.promise
  }

  return {
    push
  }
}

export function serializeHashState(
  state: Record<string, Nullable<string>>
): Optional<string> {
  return !Object.values(state).filter((i) => i !== null).length
    ? undefined
    : `#${Object.entries(state)
        .filter((entry): entry is [string, string] => !!entry[1])
        .map(([key, val]) => `${key}=${val}`)
        .join('&')}`
}

/**
 * Read/writable state similar to one in the querystring, but one that uses anchor (#) data instead
 */
export function useRouteHashState() {
  const route = useRoute()
  const router = useQueuedRouting()

  const hashState = computed({
    get: () => {
      const hash = route.hash
      if (hash.length < 2 || !hash.startsWith('#')) return {}

      const keyValuePairs = hash.substring(1).split('&')
      return reduce(
        keyValuePairs,
        (result, item) => {
          const [key, value] = item.split('=')
          if (key && value) {
            result[key] = value
          }
          return result
        },
        {} as Record<string, Nullable<string>>
      )
    },
    set: (newVal) => {
      const hashString = serializeHashState(newVal)
      router.push((route) => ({
        query: route.query,
        hash: hashString
      }))
    }
  })

  return { hashState }
}
