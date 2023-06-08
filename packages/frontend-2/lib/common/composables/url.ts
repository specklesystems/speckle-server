import { reduce } from 'lodash-es'
import { Nullable, Optional } from '@speckle/shared'
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

/**
 * Read/writable state similar to one in the querystring, but one that uses anchor (#) data instead
 */
export function useRouteHashState() {
  const route = useRoute()
  const router = useRouter()

  const hashState = writableAsyncComputed({
    get: () => {
      const hash = route.hash
      if (hash.length < 2 || !hash.startsWith('#')) return {}

      const keyValuePairs = hash.substring(1).split('&')
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
