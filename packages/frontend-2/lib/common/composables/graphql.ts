/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  OperationVariables,
  QueryOptions,
  WatchQueryFetchPolicy
} from '@apollo/client/core'
import type {
  DocumentParameter,
  OptionsParameter
} from '@vue/apollo-composable/dist/useQuery'
import { useQuery } from '@vue/apollo-composable'
import { convertThrowIntoFetchResult } from '~/lib/common/helpers/graphql'
import type { InfiniteLoaderState } from '@speckle/ui-components'
import { isUndefined } from 'lodash-es'
import { type MaybeNullOrUndefined, type Optional } from '@speckle/shared'
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

// Create TS type for object with serializable properties
type SerializableValue = string | number | boolean | null
type SerializableObject = {
  [key: string]:
    | SerializableValue
    | SerializableObject
    | SerializableValue[]
    | SerializableObject[]
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
    resolveInitialResult,
    resolveCursorFromVariables
  } = params
  const cacheBusterKey = ref(0)

  const useQueryReturn = useQuery(query, baseVariables, options || {})
  const queryKey = computed(
    () =>
      `key-${JSON.stringify(resolveKey(baseVariables.value))}-${cacheBusterKey.value}`
  )
  const currentResult = computed(() =>
    resolveCurrentResult(useQueryReturn.result.value)
  )
  const hasMoreToLoad = computed(() => {
    const currentRes = currentResult.value
    if (isUndefined(currentRes)) return true

    const itemCount = currentRes.items.length
    const totalCount = currentRes.totalCount
    return itemCount < totalCount
  })

  const getCursorForNextPage = () => {
    const currRes = currentResult.value
    const initRes = resolveInitialResult?.()

    if (currRes?.cursor) return currRes.cursor
    if (initRes?.cursor) return initRes.cursor
    return null
  }

  const onInfiniteLoad = async (state: InfiniteLoaderState) => {
    const cursor = getCursorForNextPage()
    if (!hasMoreToLoad.value || !cursor) return state.complete()

    try {
      await useQueryReturn.fetchMore({
        variables: resolveNextPageVariables(baseVariables.value, cursor)
      })
    } catch (e) {
      logger.error(e)
      state.error()
      return
    }

    state.loaded()
    if (!hasMoreToLoad.value) {
      state.complete()
    }
  }

  const bustCache = () => {
    cacheBusterKey.value++
  }

  // If for some reason the query is invoked w/ baseVariables & null cursor, we should bust the cache,
  // & reset loader state, cause a refetch was triggered for some reason (maybe a cache eviction)
  useQueryReturn.onResult(() => {
    const vars = useQueryReturn.variables.value
    const cursor = vars ? resolveCursorFromVariables(vars) : undefined

    if (!cursor) {
      // TODO: Maybe add check to skip this on initial result? Lets see how well this works first
      bustCache()
    }
  })

  return {
    query: useQueryReturn,
    identifier: queryKey,
    onInfiniteLoad,
    bustCache
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
