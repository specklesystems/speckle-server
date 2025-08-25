/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NetworkStatus,
  type OperationVariables,
  type QueryOptions,
  type WatchQueryFetchPolicy
} from '@apollo/client/core'
import type {
  DocumentParameter,
  OptionsParameter
} from '@vue/apollo-composable/dist/useQuery.js'
import { useQuery } from '@vue/apollo-composable'
import { convertThrowIntoFetchResult } from '~/lib/common/helpers/graphql'
import type { InfiniteLoaderState } from '@speckle/ui-components'
import { isUndefined } from 'lodash-es'
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import { useScopedState } from '~/lib/common/composables/scopedState'

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
      client
        .query({
          ...q,
          errorPolicy: 'all'
        })
        .catch(convertThrowIntoFetchResult)
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

// Create TS type for object with serializable properties
type SerializableValue = string | number | boolean | null
type SerializableObject = {
  [key: string]:
    | SerializableValue
    | SerializableObject
    | SerializableValue[]
    | SerializableObject[]
    | Array<SerializableValue | SerializableObject>
    | undefined
    | null
}

type BasicCursorContainer = {
  cursor?: string | null | undefined
}

type BasicPaginatedResult = BasicCursorContainer & {
  totalCount: number
  items: unknown[]
}

/**
 * Simplifies setting up pagination between an Apollo Client query and the Vue InfiniteLoader component. Manages loading next pages,
 * reseting state on refetch, and more.
 *
 * All you need to do is set up all of the params, especially the various resolution predicates
 */
export const usePaginatedQuery = <
  TResult = any,
  TVariables extends OperationVariables = OperationVariables
>(params: {
  query: DocumentParameter<TResult, TVariables>
  baseVariables: ComputedRef<TVariables>
  options?: OptionsParameter<TResult, TVariables>
  /**
   * Used to generate a unique key for the query based on variables. The key should stay the same for
   * all pages of the query, so make sure to build it only out from meaningful variables that would
   * require a new query & new pagination state if changed.
   *
   * Example: Don't include "cursor", because multiple pages of the same query will have different cursors
   */
  resolveKey: (
    vars: TVariables
  ) =>
    | SerializableValue
    | SerializableObject
    | SerializableValue[]
    | SerializableObject[]
    | Array<SerializableValue | SerializableObject>

  /**
   * Predicate for resolving the current paginated result from the query result. Return undefined
   * if query hasn't finished loading yet.
   */
  resolveCurrentResult: (
    result: TResult | undefined
  ) => BasicPaginatedResult | undefined
  /**
   * Use this to resolve the initial cursor that may have come from a previous non-paginated query. If undefined,
   * or returns undefined - we expect that there's no initial result
   */
  resolveInitialResult?: () => BasicCursorContainer | undefined
  /**
   * Predicate for resolving the variables to use for next page of items
   */
  resolveNextPageVariables: (baseVariables: TVariables, newCursor: string) => TVariables
  /**
   * Resolve cursor from variables object. If not available, return null or undefined
   */
  resolveCursorFromVariables: (vars: TVariables) => MaybeNullOrUndefined<string>
}) => {
  const logger = useLogger()

  const {
    query,
    baseVariables,
    resolveKey,
    options,
    resolveCurrentResult,
    resolveNextPageVariables,
    resolveInitialResult
  } = params
  const cacheBusterKey = ref(0)
  const loadingCompleted = ref(false)

  // can't be a computed, because we have to invoke it on the result of the fetchMore call,
  // before the result has been merged into the cache and the results become merged with results
  // of previous pages
  const hasMoreToLoad = (result: BasicPaginatedResult | undefined) => {
    if (isUndefined(result)) return true

    const itemCount = result.items.length
    const totalCount = result.totalCount
    const hasMoreItemsAccordingToCount = itemCount < totalCount
    const hasEmptyResponse = !result.items.length && !result.cursor?.length

    return hasMoreItemsAccordingToCount && !hasEmptyResponse
  }

  const useQueryReturn = useQuery(query, baseVariables, options || {})
  const queryKey = computed(
    () =>
      `key-${JSON.stringify(resolveKey(baseVariables.value))}-${cacheBusterKey.value}`
  )
  const currentResult = computed(() =>
    resolveCurrentResult(useQueryReturn.result.value)
  )

  const isVeryFirstLoading = computed(
    () => useQueryReturn.loading.value && !currentResult.value?.items.length
  )

  const getCursorForNextPage = () => {
    const currRes = currentResult.value
    const initRes = resolveInitialResult?.()

    if (currRes?.cursor) return currRes.cursor
    if (initRes?.cursor) return initRes.cursor
    return null
  }

  const onInfiniteLoad = async (state: InfiniteLoaderState) => {
    const loadComplete = () => {
      state.complete()
      loadingCompleted.value = true
    }

    const cursor = getCursorForNextPage()
    let loadMore = hasMoreToLoad(currentResult.value)
    if (!loadMore || !cursor) return loadComplete()

    try {
      const res = await useQueryReturn.fetchMore({
        variables: resolveNextPageVariables(baseVariables.value, cursor)
      })
      loadMore = hasMoreToLoad(resolveCurrentResult(res?.data))
    } catch (e) {
      logger.error(e)
      state.error()
      return
    }

    state.loaded()
    if (!loadMore) {
      loadComplete()
    }
  }

  const bustCache = () => {
    cacheBusterKey.value++
    loadingCompleted.value = false
  }

  // If after the query runs there is still more to load, but loading is marked as complete (which can happen
  // if cache is evicted and initial query reruns) - we should bust the cache,
  // & reset loader state, so infinite loader restarts
  useQueryReturn.onResult((res) => {
    if (res.loading) return

    // If more to load & loading completed, bust cache
    const moreToLoad = hasMoreToLoad(resolveCurrentResult(res?.data))
    if (moreToLoad && loadingCompleted.value) {
      bustCache()
    }
  })

  return {
    query: useQueryReturn,
    identifier: queryKey,
    onInfiniteLoad,
    bustCache,
    isVeryFirstLoading
  }
}

/**
 * We want our page queries to have the cache-and-network fetch policy, so that when you switch to a new page, the data
 * gets refreshed, but in the background - while the old data is still shown.
 *
 * This, however, is unnecessary when hydrating the SSR page in CSR for the first time, and also
 * causes weird hydration mismatches.
 *
 * So this sets the correct fetch policy based on whether this is a CSR->CSR navigation
 */
export const usePageQueryStandardFetchPolicy = () => {
  if (import.meta.server) return computed(() => undefined)

  const router = useRouter()
  const hasNavigatedInCSR = useScopedState(
    'usePageQueryStandardFetchPolicy-state',
    () => ref(false)
  )
  const quitTracking = router.beforeEach((to, from) => {
    if (!from || !to) return
    hasNavigatedInCSR.value = true
    quitTracking()
  })

  return computed((): Optional<WatchQueryFetchPolicy> => {
    // use cache, but reload in background
    // we only wanna do this when transitioning between CSR routes
    return hasNavigatedInCSR.value ? 'cache-and-network' : undefined
  })
}

/**
 * By default 'variables' off useQuery updates the moment variables are updated. This returns the variables
 * associated with the active result. So if the result is still loading, the variables are gonna be undefined too.
 */
export const useQueryResultVariables = <
  TResult = any,
  TVariables extends OperationVariables = OperationVariables
>(
  useQueryRet: ReturnType<typeof useQuery<TResult, TVariables>>
) => {
  const { variables, onResult } = useQueryRet

  const currentVariables = shallowRef<(typeof variables)['value']>()
  onResult((res) => {
    if (res.networkStatus !== NetworkStatus.ready) return
    currentVariables.value = variables.value
  })

  const resultVariables = computed(() => currentVariables.value)

  return resultVariables
}
