import type { QueryOptions } from '@apollo/client/core'
import { convertThrowIntoFetchResult } from '~/lib/common/helpers/graphql'

export const useApolloClientIfAvailable = () => {
  const nuxt = useNuxtApp()
  const getClient = () => (nuxt.$apollo?.default ? nuxt.$apollo.default : undefined)
  return getClient
}

export const useApolloClientFromNuxt = () => {
  const getClient = useApolloClientIfAvailable()
  const client = getClient()
  if (!client) {
    throw new Error("Apollo Client can't be resolved from NuxtApp yet")
  }

  return client
}

export const usePreloadApolloQueries = () => {
  const client = useApolloClientFromNuxt()
  return async (params: { queries: QueryOptions[] }) => {
    const { queries } = params

    const promises = queries.map((q) =>
      client.query(q).catch(convertThrowIntoFetchResult)
    )
    return await Promise.all(promises)
  }
}

/**
 * Useful in SSR to track when a useQuery call has loaded. Just pass in the useQuery call's
 * onResult callback
 */
export const useQueryLoaded = (params: {
  onResult: (loadedCb: () => unknown) => unknown
}) => {
  const { onResult } = params

  const loaded = ref(false)
  onResult(() => {
    loaded.value = true
  })

  return loaded
}
