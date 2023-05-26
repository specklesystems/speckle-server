import { reduce } from 'lodash-es'
import { Nullable, Optional } from '@speckle/shared'
import { createControllablePromise } from '~~/lib/common/helpers/promise'

/**
 * In complex scenarios when there are possibly multiple concurrent router.push() calls occurring (e.g.
 * updating the hash state and in another place updating params) the router seems to break.
 * To get around this you can use this composable to queue router.push() calls in such a way
 * that they will always be invoked serially.
 */
export function useQueuedRouting() {
  const router = useRouter()
  const queuedCalls = ref(
    [] as Array<{
      args: Parameters<typeof router.push>
      res: ReturnType<
        typeof createControllablePromise<Awaited<ReturnType<typeof router.push>>>
      >
    }>
  )

  const push = async (...args: Parameters<typeof router.push>) => {
    const res = createControllablePromise<Awaited<ReturnType<typeof router.push>>>()
    queuedCalls.value = [...queuedCalls.value, { args, res }]
    return await res.promise
  }

  watch(queuedCalls, async (calls) => {
    if (!calls.length) return

    // pop 1 call and invoke it
    const pushCall = queuedCalls.value[0]

    try {
      const result = await router.push(...pushCall.args)
      pushCall.res.resolve(result)
    } catch (e) {
      pushCall.res.reject(e)
    }

    // updated queuedCalls, which should re-trigger the watcher
    queuedCalls.value = queuedCalls.value.slice(1)
  })

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
      router.push({
        query: route.query,
        hash: hashString
      })
    }
  })

  return { hashState }
}
