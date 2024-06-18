import { reduce } from 'lodash-es'
import type { Nullable, Optional } from '@speckle/shared'
import { writableAsyncComputed } from '~~/lib/common/composables/async'

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

export function deserializeHashState(hashString: string) {
  if (hashString.length < 2 || !hashString.startsWith('#')) return {}

  const keyValuePairs = hashString.substring(1).split('&')
  const result = reduce(
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
  return result
}

/**
 * Read/writable state similar to one in the querystring, but one that uses anchor (#) data instead
 */
export function useRouteHashState() {
  const route = useRoute()
  const router = useRouter()

  const hashState = writableAsyncComputed({
    get: () => {
      return deserializeHashState(route.hash)
    },
    set: async (newVal) => {
      const hashString = serializeHashState(newVal)
      await router.push({
        query: route.query,
        hash: hashString
      })
    },
    initialState: {},
    asyncRead: false
  })

  return { hashState }
}
