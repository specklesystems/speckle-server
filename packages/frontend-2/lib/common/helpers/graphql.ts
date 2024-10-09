/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { isNullOrUndefined, isUndefinedOrVoid } from '@speckle/shared'
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import { ApolloError, defaultDataIdFromObject } from '@apollo/client/core'
import type {
  FetchResult,
  DataProxy,
  TypedDocumentNode,
  ServerError,
  ServerParseError,
  ApolloCache
} from '@apollo/client/core'
import { GraphQLError } from 'graphql'
import type { DocumentNode } from 'graphql'
import {
  flatten,
  has,
  isFunction,
  isString,
  isArray,
  intersection,
  get,
  set,
  cloneDeep,
  isObjectLike
} from 'lodash-es'
import type { Modifier, ModifierDetails, Reference } from '@apollo/client/cache'
import type { Get, PartialDeep, Paths, ReadonlyDeep, Tagged } from 'type-fest'
import type { GraphQLErrors, NetworkError } from '@apollo/client/errors'
import { nanoid } from 'nanoid'
import { StackTrace } from '~~/lib/common/helpers/debugging'
import dayjs from 'dayjs'
import { base64Encode } from '~/lib/common/helpers/encodeDecode'
import type { ErrorResponse } from '@apollo/client/link/error'
import type {
  AllObjectFieldArgTypes,
  AllObjectTypes
} from '~/lib/common/generated/gql/graphql'

/**
 * Cache key of a specific cached GQL object. Tends to look like `Type:id`.
 */
export type ApolloCacheObjectKey<Type extends keyof AllObjectTypes> = Tagged<
  string,
  Type
>

export const isServerError = (err: Error): err is ServerError =>
  has(err, 'response') && has(err, 'result') && has(err, 'statusCode')
export const isServerParseError = (err: Error): err is ServerParseError =>
  has(err, 'response') && has(err, 'bodyText') && has(err, 'statusCode')

export const ROOT_QUERY = 'ROOT_QUERY' as ApolloCacheObjectKey<'Query'>
export const ROOT_MUTATION = 'ROOT_MUTATION' as ApolloCacheObjectKey<'Mutation'>
export const ROOT_SUBSCRIPTION =
  'ROOT_SUBSCRIPTION' as ApolloCacheObjectKey<'Subscription'>

type ModifyFnCacheDataSingle<Data> = Data extends Record<string, unknown>
  ? Data extends { id: string; __typename?: infer TypeName }
    ? CacheObjectReference<TypeName extends keyof AllObjectTypes ? TypeName : string>
    : PartialDeep<{
        [key in keyof Data]: ModifyFnCacheData<Data[key]>
      }>
  : Data

/**
 * Utility type for typing cached data in Apollo modify functions.
 * Essentially inside a modify function all references to cached objects that can be uniquely identified (have an ID field) are converted
 * to CacheObjectReference objects and additionally all properties are optional as you can never know what exactly has been requested & cached
 * and what hasn't
 */
export type ModifyFnCacheData<Data> = Data extends Array<infer ArrayItem>
  ? ModifyFnCacheDataSingle<ArrayItem>[]
  : ModifyFnCacheDataSingle<Data>

/**
 * Get a cached object's identifier
 */
export function getCacheId<Type extends keyof AllObjectTypes>(
  typeName: Type,
  id: string
): ApolloCacheObjectKey<Type> {
  const cachedId = defaultDataIdFromObject({
    __typename: typeName,
    id
  })
  if (!cachedId) throw new Error('Unable to build Apollo cache ID')

  return cachedId as ApolloCacheObjectKey<Type>
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

    if (!gqlErrors.length) {
      if (
        err.networkError &&
        'result' in err.networkError &&
        !isString(err.networkError.result) &&
        isArray(err.networkError.result.errors)
      ) {
        const errors = err.networkError.result.errors as Array<{ message: string }>
        gqlErrors = errors.map((e) => new GraphQLError(e.message))
      }
    }
  } else if (err instanceof Error) {
    gqlErrors = [new GraphQLError(err.message)]
  } else {
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
  updater: (data: TData) => TData | undefined,
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
export type CacheObjectReference<Type extends string = string> = {
  readonly __ref: Type extends keyof AllObjectTypes
    ? ApolloCacheObjectKey<Type>
    : string
}

/**
 * Objects & object arrays in `cache.modify` calls are represented through reference objects, so
 * if you want to add new ones you shouldn't add the entire object, but only its reference
 */
export function getObjectReference<Type extends keyof AllObjectTypes>(
  typeName: Type,
  id: string
): CacheObjectReference<Type> {
  return {
    __ref: getCacheId(typeName, id)
  } as CacheObjectReference<Type>
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
export const revolveFieldNameAndVariables = <
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
 * @deprecated Use modifyObjectField instead
 */
export function modifyObjectFields<
  Variables extends Optional<Record<string, unknown>> = undefined,
  FieldData = unknown
>(
  cache: ApolloCache<unknown>,
  id: string,
  updater: (
    fieldName: string,
    variables: Variables,
    value: ModifyFnCacheData<FieldData>,
    details: Parameters<Modifier<ModifyFnCacheData<FieldData>>>[1] & {
      ref: typeof getObjectReference
      revolveFieldNameAndVariables: typeof revolveFieldNameAndVariables
    }
  ) =>
    | Optional<ModifyFnCacheData<FieldData>>
    | Parameters<Modifier<ModifyFnCacheData<FieldData>>>[1]['DELETE']
    | Parameters<Modifier<ModifyFnCacheData<FieldData>>>[1]['INVALIDATE']
    | void,
  options?: Partial<{
    fieldNameWhitelist: string[]
    debug: boolean
  }>
) {
  const { fieldNameWhitelist, debug = !!(import.meta.dev && import.meta.client) } =
    options || {}

  const logger = useLogger()
  const invocationId = nanoid()
  const log = (...args: Parameters<typeof logger.debug>) => {
    if (!debug) return
    const [message, ...rest] = args

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

      const { variables } = revolveFieldNameAndVariables<Variables>(
        storeFieldName,
        fieldName
      )

      log('invoking updater', { fieldName, variables, fieldValue })
      try {
        const res = updater(
          fieldName,
          (variables || {}) as Variables,
          fieldValue as ModifyFnCacheData<FieldData>,
          {
            ...details,
            ref: getObjectReference,
            revolveFieldNameAndVariables
          }
        )

        if (isUndefinedOrVoid(res)) {
          return fieldValue as unknown
        } else {
          log('updater returned', { res })
          return res
        }
      } catch (e) {
        log('updater threw an error', e)
        throw e
      }
    }
  })
}

/**
 * Iterate over a cached object's fields and evict/delete the ones that the predicate returns true for
 * Note: This uses cache.modify underneath which means that `data` will only hold object references (CacheObjectReference) not
 * full objects. Read more: https://www.apollographql.com/docs/react/caching/cache-interaction/#values-vs-references
 * @deprecated Use modifyObjectField instead, just return the evict() call from the updater
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

export const resolveGenericStatusCode = (errors: GraphQLErrors) => {
  if (errors.some((e) => e.extensions?.code === 'FORBIDDEN')) return 403
  if (
    errors.some((e) =>
      ['UNAUTHENTICATED', 'UNAUTHORIZED_ACCESS_ERROR'].includes(
        (e.extensions?.code || '') as string
      )
    )
  )
    return 401
  if (
    errors.some((e) =>
      ['NOT_FOUND_ERROR', 'STREAM_NOT_FOUND', 'AUTOMATION_NOT_FOUND'].includes(
        (e.extensions?.code || '') as string
      )
    )
  )
    return 404

  return 500
}

export const errorFailedAtPathSegment = (error: GraphQLError, segment: string) => {
  const path = error.path || []
  return path[path.length - 1] === segment
}

export const getDateCursorFromReference = (params: {
  ref: Reference
  dateProp: string
  readField: (fieldName: string, ref: Reference) => unknown
}): string | null => {
  const dateStr = params.readField(params.dateProp, params.ref) as string
  if (!dateStr || !isString(dateStr)) return null

  const date = dayjs(dateStr)
  if (!date.isValid()) return null

  const iso = date.toISOString()
  return base64Encode(iso)
}

/**
 * Build skipLoggingErrors function that skips logging errors if there's only one error and it's related to a specific field
 */
export const skipLoggingErrorsIfOneFieldError =
  (fieldName: string | string[]) =>
  (err: ErrorResponse): boolean => {
    const fieldNames = isArray(fieldName) ? fieldName : [fieldName]
    return (
      err.graphQLErrors?.length === 1 &&
      err.graphQLErrors.some((e) => intersection(e.path || [], fieldNames).length > 0)
    )
  }

type NonUndefined<T> = T extends undefined ? never : T

/**
 * Update field at specific path in object, only if it exists. Useful for cache modification
 * when fields should only be updated if they exist.
 */
export const updatePathIfExists = <Value, Path extends Paths<Value> & string>(
  val: Value,
  path: Path,
  updater: (val: NonUndefined<Get<Value, Path>>) => NonUndefined<Get<Value, Path>>
) => {
  if (!val) return val

  if (has(val, path)) {
    const pathVal = get(val, path) as NonUndefined<Get<Value, Path>>
    const newVal = updater(pathVal)
    set(val, path, newVal)
  }

  return val
}

/**
 * Get value from specific path in object, only if it exists.
 */
export const getFromPathIfExists = <Value, Path extends Paths<Value> & string>(
  val: MaybeNullOrUndefined<Value>,
  path: Path
): Optional<Get<Value, Path>> => {
  if (!val) return undefined
  if (!has(val, path)) return undefined
  return get(val, path) as Get<Value, Path>
}

type ModifyObjectFieldValue<
  Type extends keyof AllObjectTypes,
  Field extends keyof AllObjectTypes[Type]
> = ModifyFnCacheData<AllObjectTypes[Type][Field]>

/**
 * Simplified & improved version of modifyObjectFields, just targetting a single field for a cache modification
 * @see modifyObjectFields
 */
export const modifyObjectField = <
  Type extends keyof AllObjectTypes,
  Field extends keyof AllObjectTypes[Type]
>(
  cache: ApolloCache<unknown>,
  key: ApolloCacheObjectKey<Type>,
  fieldName: Field,
  updater: (params: {
    fieldName: string
    variables: Field extends keyof AllObjectFieldArgTypes[Type]
      ? AllObjectFieldArgTypes[Type][Field]
      : never
    /**
     * Value found in the cache. Read-only and should not be mutated directly. Use the
     * createUpdatedValue() helper to build a new value with updated fields.
     */
    value: ReadonlyDeep<ModifyObjectFieldValue<Type, Field>>
    helpers: {
      /**
       * Build new value with the values at specific paths updated with the provided updater functions,
       * ONLY if the paths exist in the cache.
       *
       * This function operates on a deeply cloned value that is safe to mutate
       */
      createUpdatedValue: (
        updateHandler: (params: {
          /**
           * Invoke this function to update one specific path in the object
           */
          update: <Path extends Paths<ModifyObjectFieldValue<Type, Field>> & string>(
            path: Path,
            pathUpdate: (
              val: NonUndefined<Get<ModifyObjectFieldValue<Type, Field>, Path>>
            ) => NonUndefined<Get<ModifyObjectFieldValue<Type, Field>, Path>>
          ) => MaybeNullOrUndefined<ModifyObjectFieldValue<Type, Field>>
        }) => void
      ) => ModifyObjectFieldValue<Type, Field>
      /**
       * Get value from specific path, only if it exists in the cache value
       */
      get: <Path extends Paths<ModifyObjectFieldValue<Type, Field>> & string>(
        path: Path
      ) => Optional<Get<ModifyObjectFieldValue<Type, Field>, Path>>
      /**
       * Invoke and return this out from the modify call to evict the field from the cache
       */
      evict: () => ModifierDetails['DELETE']
      /**
       * Read field data from a Reference object
       */
      readField: <
        ReadFieldType extends keyof AllObjectTypes,
        ReadFieldName extends keyof AllObjectTypes[ReadFieldType] & string
      >(
        ref: CacheObjectReference<ReadFieldType>,
        fieldName: ReadFieldName
      ) => Optional<AllObjectTypes[ReadFieldType][ReadFieldName]>
      /**
       * Build a reference object for a specific object in the cache
       */
      ref: typeof getObjectReference
    }
  }) =>
    | Optional<ModifyObjectFieldValue<Type, Field>>
    | ReadonlyDeep<ModifyObjectFieldValue<Type, Field>>
    | ModifierDetails['DELETE']
    | ModifierDetails['INVALIDATE']
    | void,
  options?: Partial<{
    debug: boolean
    /**
     * Whether to auto evict values that have variables with common filters in them (e.g. a 'filter' or
     * 'search' prop). Often its better to evict filtered values, because we can't tell if the newly
     * added item should be included in the filtered list or not.
     */
    autoEvictFiltered: boolean
  }>
) => {
  const { autoEvictFiltered } = options || {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modifyObjectFields<any, any>(
    cache,
    key,
    (field, variables, value, details) => {
      if (field !== fieldName) return

      // Auto evict filtered values?
      if (autoEvictFiltered && isObjectLike(variables)) {
        const checkFilter = (filter: string) => {
          if (!has(variables, filter)) return false
          const val = get(variables, filter)

          // True, if any primitive value (e.g. string, number) && arrays
          if (isNullOrUndefined(val)) return false
          if (isArray(val)) return true
          if (!isObjectLike(val)) return true
          return false
        }

        const commonFilters = ['query', 'filter', 'search', 'filter.search']
        const hasFilter = commonFilters.some(checkFilter)

        if (hasFilter) {
          return details.DELETE
        }
      }

      // Build helpers & clone value to allow for direct mutation
      const createUpdatedValue = (
        updateHandler: (params: {
          update: <Path extends Paths<ModifyObjectFieldValue<Type, Field>> & string>(
            path: Path,
            pathUpdate: (
              val: NonUndefined<Get<ModifyObjectFieldValue<Type, Field>, Path>>
            ) => NonUndefined<Get<ModifyObjectFieldValue<Type, Field>, Path>>
          ) => MaybeNullOrUndefined<ModifyObjectFieldValue<Type, Field>>
        }) => void
      ) => {
        let clonedValue = cloneDeep(value) as ModifyObjectFieldValue<Type, Field>
        updateHandler({
          update: (path, pathUpdate) => {
            clonedValue = updatePathIfExists(clonedValue, path, pathUpdate)
            return clonedValue
          }
        })
        return clonedValue
      }

      const getIfExists = <
        Path extends Paths<ModifyObjectFieldValue<Type, Field>> & string
      >(
        path: Path
      ) => getFromPathIfExists<ModifyObjectFieldValue<Type, Field>, Path>(value, path)
      const evict = () => details.DELETE
      const readField = <
        ReadFieldType extends keyof AllObjectTypes,
        ReadFieldName extends keyof AllObjectTypes[ReadFieldType] & string
      >(
        ref: CacheObjectReference<ReadFieldType>,
        fieldName: ReadFieldName
      ) =>
        details.readField(
          fieldName,
          ref
        ) as AllObjectTypes[ReadFieldType][ReadFieldName]

      return updater({
        fieldName: field,
        variables,
        value,
        helpers: {
          createUpdatedValue,
          get: getIfExists,
          evict,
          readField,
          ref: getObjectReference
        }
      })
    },
    options
  )
}
