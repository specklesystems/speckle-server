/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { isUndefinedOrVoid, Optional } from '@speckle/shared'
import {
  ApolloError,
  FetchResult,
  DataProxy,
  ApolloCache,
  defaultDataIdFromObject,
  TypedDocumentNode,
  ServerError,
  ServerParseError
} from '@apollo/client/core'
import { DocumentNode, GraphQLError } from 'graphql'
import { flatten, isUndefined, has, isFunction, isString } from 'lodash-es'
import { Modifier, Reference } from '@apollo/client/cache'
import { PartialDeep } from 'type-fest'
import { NetworkError } from '@apollo/client/errors'
import { nanoid } from 'nanoid'
import { StackTrace } from '~~/lib/common/helpers/debugging'

export const isServerError = (err: Error): err is ServerError =>
  has(err, 'response') && has(err, 'result') && has(err, 'statusCode')
export const isServerParseError = (err: Error): err is ServerParseError =>
  has(err, 'response') && has(err, 'bodyText') && has(err, 'statusCode')

export const ROOT_QUERY = 'ROOT_QUERY'
export const ROOT_MUTATION = 'ROOT_MUTATION'
export const ROOT_SUBSCRIPTION = 'ROOT_SUBSCRIPTION'

/**
 * Utility type for typing cached data in Apollo modify functions.
 * Essentially inside a modify function all references to cached objects that can be uniquely identified (have an ID field) are converted
 * to CacheObjectReference objects and additionally all properties are optional as you can never know what exactly has been requested & cached
 * and what hasn't
 */
export type ModifyFnCacheData<Data> = Data extends
  | Record<string, unknown>
  | Record<string, unknown>[]
  ? PartialDeep<{
      [key in keyof Data]: Data[key] extends { id: string }
        ? CacheObjectReference
        : Data[key] extends { id: string }[]
        ? CacheObjectReference[]
        : ModifyFnCacheData<Data[key]>
    }>
  : Data

/**
 * Get a cached object's identifier
 */
export function getCacheId(typeName: string, id: string) {
  const cachedId = defaultDataIdFromObject({
    __typename: typeName,
    id
  })
  if (!cachedId) throw new Error('Unable to build Apollo cache ID')

  return cachedId
}

export function isInvalidAuth(error: ApolloError | NetworkError) {
  const networkError = error instanceof ApolloError ? error.networkError : error
  if (
    !networkError ||
    (!isServerError(networkError) && !isServerParseError(networkError))
  )
    return false

  const statusCode = networkError.statusCode
  const hasCorrectCode = [403].includes(statusCode)
  if (!hasCorrectCode) return false

  const message: string | undefined = isServerError(networkError)
    ? isString(networkError.result)
      ? networkError.result
      : networkError.result?.error
    : networkError.bodyText

  return (message || '').toLowerCase().includes('token')
}

/**
 * Convert an error thrown during $apollo.mutate() into a fetch result
 */
export function convertThrowIntoFetchResult(
  err: unknown
): FetchResult<undefined> & { apolloError?: ApolloError; isInvalidAuth: boolean } {
  let gqlErrors: readonly GraphQLError[]
  let apolloError: Optional<ApolloError> = undefined
  if (err instanceof ApolloError) {
    gqlErrors = err.graphQLErrors
    apolloError = err
  } else if (err instanceof Error) {
    gqlErrors = [new GraphQLError(err.message)]
  } else {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    gqlErrors = [new GraphQLError(`${err}`)]
  }

  const hasAuthIssue = apolloError && isInvalidAuth(apolloError)

  return {
    data: undefined,
    errors: gqlErrors,
    apolloError,
    isInvalidAuth: !!hasAuthIssue
  }
}

/**
 * Get first error message from a GQL errors array
 */
export function getFirstErrorMessage(
  errs: readonly GraphQLError[] | undefined | null,
  fallbackMessage = 'An unexpected issue occurred'
): string {
  return errs?.[0]?.message || fallbackMessage
}

/**
 * Find some cached Apollo data through a fragment/query and use the updater function
 * to return the replacement for the data that the fragment initially found
 * @returns Whether an update was made
 */
export function updateCacheByFilter<TData, TVariables = unknown>(
  cache: ApolloCache<unknown>,
  filter: {
    fragment?: DataProxy.Fragment<TVariables, TData>
    query?: DataProxy.Query<TVariables, TData>
  },
  /**
   * If returns undefined/void, then updating is essentially canceled. Be careful not to
   * mutate anything being passed into this function! E.g. if you want to mutate arrays,
   * create new arrays through slice()/filter() instead
   */
  updater: (data: TData) => TData | undefined | void,
  options: Partial<{
    /**
     * Whether to suppress errors that occur when the fragment being queried
     * doesn't find anything
     * Default: true
     */
    ignoreCacheErrors: boolean

    /**
     * Whether to overwrite the old cache results, instead of triggering a merge function
     * to merge the old and new results.
     * Default: true
     */
    overwrite: boolean
  }> = {}
): boolean {
  const { fragment, query } = filter
  const { ignoreCacheErrors = true, overwrite = true } = options
  const logger = useLogger()

  if (!fragment && !query) {
    throw new Error(
      'Either fragment or query must be specified to be able to find cached data to update'
    )
  }

  const readData = (): TData | null => {
    if (fragment) {
      return cache.readFragment(fragment)
    } else if (query) {
      return cache.readQuery(query)
    } else {
      return null
    }
  }

  const writeData = (data: TData): boolean => {
    if (fragment) {
      cache.writeFragment({ ...fragment, data, overwrite })
      return true
    } else if (query) {
      cache.writeQuery({ ...query, data, overwrite })
      return true
    } else {
      return false
    }
  }

  try {
    const currentData = readData()
    if (!currentData) return false

    const newData = updater(currentData)
    if (isUndefinedOrVoid(newData)) return false

    return writeData(newData)
  } catch (e: unknown) {
    if (e instanceof Error) {
      // Invalid fragment - throw always
      if (e.message.toLowerCase().includes('no fragment named')) {
        throw e
      }
    }

    if (ignoreCacheErrors) {
      logger.warn('Failed Apollo cache update:', e)
      return false
    }
    throw e
  }
}

/**
 * A graphql-codegen generated fragment doesn't include the definition of other fragments in it,
 * so if you ever need a document that contains a fragment as well as other fragments that it uses
 * you can use this helper
 *
 * TODO: Figure out if we can turn off dedupeFragments to get fragments to contain all dependency
 * fragments as well. Previously this caused an error when duplicate fragments were sent to the API
 * through a query/mutation.
 */
export function addFragmentDependencies<R = unknown, V = unknown>(
  fragment: TypedDocumentNode<R, V>,
  ...fragmentDependencies: DocumentNode[]
) {
  return {
    kind: 'Document',
    definitions: [
      ...fragment.definitions.filter((d) => d.kind === 'FragmentDefinition'),
      ...flatten(
        fragmentDependencies.map((f) =>
          f.definitions.filter((d) => d.kind === 'FragmentDefinition')
        )
      )
    ]
  } as TypedDocumentNode<R, V>
}

/**
 * Resolve the string key of a field in the apollo cache. Is useful in cache.modify() calls.
 */
export function getStoreFieldName(
  fieldName: string,
  variables?: Record<string, unknown>
) {
  return (
    fieldName +
    (Object.values(variables || {}).length ? `:${JSON.stringify(variables)}` : '')
  )
}

/**
 * Inside cache.modify calls you'll get these instead of full objects when reading fields that hold
 * identifiable objects or object arrays
 */
export type CacheObjectReference = Reference

/**
 * Objects & object arrays in `cache.modify` calls are represented through reference objects, so
 * if you want to add new ones you shouldn't add the entire object, but only its reference
 */
export function getObjectReference(typeName: string, id: string): CacheObjectReference {
  return {
    __ref: getCacheId(typeName, id)
  }
}

export function isReference(obj: unknown): obj is CacheObjectReference {
  return has(obj, '__ref')
}

/**
 * Resolve the field name and variables from an Apollo store field name which
 * is usually a string like "fieldName:{"var1":"val1","var2":"val2"}"
 * @param storeFieldName
 * @param fieldName
 */
const revolveFieldNameAndVariables = <
  V extends Optional<Record<string, unknown>> = undefined
>(
  storeFieldName: string,
  fieldName?: string
) => {
  let variables: Optional<V> = undefined

  if (!fieldName) {
    fieldName = /^[a-zA-Z0-9_-]+(?=[:(])/.exec(storeFieldName)?.[0]
  }
  if (!fieldName?.length) return { fieldName: storeFieldName, variables }

  const variablesStringbase = storeFieldName.substring(fieldName.length)
  if (variablesStringbase.startsWith(':')) {
    variables = JSON.parse(variablesStringbase.substring(1)) as V
  } else if (variablesStringbase.startsWith('(')) {
    variables = JSON.parse(
      variablesStringbase.substring(1, variablesStringbase.length - 1)
    ) as V
  }

  return {
    fieldName,
    variables
  }
}

/**
 * Iterate over a cached object's fields and optionally update them. Similar to cache.modify, except allows
 * better filtering capabilities to filter filters to update (e.g. you can actually get each field's variables)
 * Note: This uses cache.modify underneath which means that `data` will only hold object references (CacheObjectReference) not
 * full objects. Read more: https://www.apollographql.com/docs/react/caching/cache-interaction/#values-vs-references
 */
export function modifyObjectFields<
  V extends Optional<Record<string, unknown>> = undefined,
  D = unknown
>(
  cache: ApolloCache<unknown>,
  id: string,
  updater: (
    fieldName: string,
    variables: V,
    value: ModifyFnCacheData<D>,
    details: Parameters<Modifier<ModifyFnCacheData<D>>>[1] & {
      ref: typeof getObjectReference
      revolveFieldNameAndVariables: typeof revolveFieldNameAndVariables
    }
  ) => Optional<ModifyFnCacheData<D>> | void,
  options?: Partial<{
    fieldNameWhitelist: string[]
    debug: boolean
  }>
) {
  const { fieldNameWhitelist, debug = !!(process.dev && process.client) } =
    options || {}

  const logger = useLogger()
  const invocationId = nanoid()
  const log = (...args: Parameters<typeof logger.debug>) => {
    if (!debug) return
    const [message, ...rest] = args

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    logger.debug(`[${invocationId}] ${message}`, ...rest)
  }

  log(
    'modifyObjectFields invoked',
    {
      id,
      fieldNameWhitelist
    },
    new StackTrace()
  )
  cache.modify({
    id,
    fields(fieldValue, details) {
      const { storeFieldName, fieldName } = details

      if (fieldNameWhitelist?.length && !fieldNameWhitelist.includes(fieldName)) {
        return fieldValue as unknown
      }

      const { variables } = revolveFieldNameAndVariables<V>(storeFieldName, fieldName)

      log('invoking updater', { fieldName, variables, fieldValue })
      const res = updater(
        fieldName,
        variables as V,
        fieldValue as ModifyFnCacheData<D>,
        {
          ...details,
          ref: getObjectReference,
          revolveFieldNameAndVariables
        }
      )

      if (isUndefined(res)) {
        return fieldValue as unknown
      } else {
        log('updater returned', { res })
        return res
      }
    }
  })
}

/**
 * Iterate over a cached object's fields and evict/delete the ones that the predicate returns true for
 * Note: This uses cache.modify underneath which means that `data` will only hold object references (CacheObjectReference) not
 * full objects. Read more: https://www.apollographql.com/docs/react/caching/cache-interaction/#values-vs-references
 */
export function evictObjectFields<
  V extends Optional<Record<string, unknown>> = undefined,
  D = unknown
>(
  cache: ApolloCache<unknown>,
  id: string,
  predicate:
    | ((
        fieldName: string,
        variables: V,
        value: ModifyFnCacheData<D>,
        details: Parameters<Modifier<ModifyFnCacheData<D>>>[1] & {
          revolveFieldNameAndVariables: typeof revolveFieldNameAndVariables
        }
      ) => boolean)
    | string[]
) {
  modifyObjectFields<V, D>(
    cache,
    id,
    (fieldName, variables, value, details) => {
      if (isFunction(predicate)) {
        if (
          !predicate(fieldName, variables, value, {
            ...details,
            revolveFieldNameAndVariables
          })
        )
          return undefined
      } else {
        const predicateFields = predicate
        if (!predicateFields.includes(fieldName)) return undefined
      }
      return details.DELETE as ModifyFnCacheData<D>
    },
    { debug: false }
  )
}
