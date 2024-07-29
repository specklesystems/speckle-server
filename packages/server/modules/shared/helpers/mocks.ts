/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db/knex'
import { ResolverFn, Resolvers } from '@/modules/core/graph/generated/graphql'
import { IMockStore, IMocks, isRef, Ref } from '@graphql-tools/mock'
import { GraphQLResolveInfo } from 'graphql'
import { get, has, isArray, isObjectLike, random } from 'lodash'

export type SpeckleModuleMocksConfig = {
  resolvers?: (params: {
    store: IMockStore
    helpers: ReturnType<typeof mockStoreHelpers>
  }) => Resolvers
  mocks?: IMocks
}

type SimpleRef = { type: string; id: string }
const isSimpleRef = (obj: any): obj is SimpleRef =>
  isObjectLike(obj) && Object.keys(obj).length === 2 && 'type' in obj && 'id' in obj

export const mockStoreHelpers = (store: IMockStore) => {
  /**
   * We have to use an internal api, but there is no other way to check
   * for the existence of a field in the mock store.
   */
  const hasField = (type: string, key: string, field: string) => {
    const internalStore = get(store, 'store') as {
      [type: string]: {
        [key: string]: {
          [field: string]: unknown
        }
      }
    }

    return has(internalStore, [type, key, field])
  }

  const addMockRefValues = (ref: Ref, values: Record<string, any>) => {
    store.set(ref, values)
    return ref
  }

  const getMockRef = <T = any>(
    type: string,
    options?: {
      /**
       * The id of the object to get. If object w/ this ID already exists in the mock store,
       * it will be retrieved from there. Otherwise, a new object will be created.
       */
      id?: string
      /**
       * Additional field values that should be set on the object
       */
      values?: Record<string, any>
    }
  ) => {
    const { id, values } = options || {}
    const ret = values
      ? store.get(type, {
          ...values,
          ...(id ? { id } : {})
        })
      : store.get(type, id)
    return ret as T
  }

  const setMockValues = (ref: Ref | SimpleRef, values: Record<string, any>) => {
    if (isRef(ref)) {
      store.set(ref, values)
    } else {
      store.set(ref.type, ref.id, values)
    }
  }

  const getFieldValue = <T = any>(
    refOrObj: Record<string, unknown> | Ref | SimpleRef,
    field: string
  ) => {
    if (isRef(refOrObj)) return store.get(refOrObj, field) as T
    if (isSimpleRef(refOrObj)) return store.get(refOrObj.type, refOrObj.id, field) as T
    return refOrObj[field] as T
  }

  type AnyResolverFn = ResolverFn<any, any, any, any>

  const resolveFromMockParent = (
    options?: Partial<{
      /**
       * Allows you to map any refs found (whether they're in arrays or not) to something else,
       * e.g. the same mock, but with different arg values
       */
      mapRefs: (
        mockRef: Ref,
        resolverArgs: { parent: any; args: any; ctx: any; info: GraphQLResolveInfo }
      ) => any
    }>
  ) => {
    const { mapRefs } = options || {}

    const resolver: AnyResolverFn = (parent, args, ctx, info) => {
      const resolverArgs = { parent, args, ctx, info }
      const val = getFieldValue(parent, info.fieldName)
      if (!mapRefs) return val

      if (isArray(val)) {
        return val.map((v) => (isRef(v) ? mapRefs(v, resolverArgs) : v))
      } else {
        return isRef(val) ? mapRefs(val, resolverArgs) : val
      }
    }

    return resolver
  }

  const resolveAndCache = (resolver: AnyResolverFn) => {
    const wrapperResolver: AnyResolverFn = (parent, args, ctx, info) => {
      let cached: any

      if (!isRef(parent) && !has(parent, 'id')) {
        throw new Error(
          'resolveAndCache depends on resolver parent being a mock ref or an object with an ID field'
        )
      }

      if (isRef(parent)) {
        if (hasField(parent.$ref.typeName, parent.$ref.key, info.fieldName)) {
          cached = store.get(parent, info.fieldName)
        }
      } else {
        if (hasField(info.parentType.name, parent.id, info.fieldName)) {
          cached = store.get(info.parentType.name, parent.id, info.fieldName)
        }
      }

      if (cached) return cached

      const val = resolver(parent, args, ctx, info)
      if (isRef(parent)) {
        store.set(parent, info.fieldName, val)
      } else {
        store.set(info.parentType.name, parent.id, info.fieldName, val)
      }

      return val
    }

    return wrapperResolver
  }

  return {
    /**
     * Get mock reference. It can be returned from resolvers and converted to the actual mock
     * when outputted to response.
     */
    getMockRef,
    /**
     * Get value from a mock reference or plain object.
     *
     * Useful when you need to access something from parent, where you don't know if it's
     * gonna be a mock reference or the actual object.
     * Also useful for just getting arbitrary field values from mock refs.
     */
    getFieldValue,
    /**
     * Invoke this in place of a resolver definition to just tell Apollo to take the value from
     * the mock in `parent`.
     *
     * This is useful when there's a real resolver that blocks access to the mock, so you
     * need to create a mock resolver that just returns the value from the parent.
     */
    resolveFromMockParent,
    /**
     * Update specific values in mock
     */
    addMockRefValues,
    /**
     * Wraps your resolver with a caching mechanism that caches the value in the MockStore
     * for this specific parent object
     *
     * Useful when parent object is not a MockRef, but you want to mock out and cache some of its values.
     * Or it may be a MockRef, but for some reason you can't just define the field in the mock definition
     * and need a resolver
     */
    resolveAndCache,
    /**
     * Set/update values into a mock in the mockstore. Useful in mocked mutations.
     */
    setMockValues
  }
}

export const getRandomDbRecords = async <T extends {} = any>(params: {
  tableName: string
  min: number
  max?: number
}) => {
  const { tableName, min, max } = params
  if (max && max < min) {
    throw new Error('Max cannot be less than min')
  }

  const finalCount = max ? random(min, max) : min

  // Query could be slow on large datasets, but for test/dev envs it should be fine
  const res = await db(tableName)
    .select<T>('*')
    .orderByRaw('RANDOM()')
    .limit(finalCount)
  return res as T[]
}

/**
 * For defining lists of size X in mock fields. If 2nd arg is specified, the size will be random
 * between the two numbers.
 */
export const listMock = (min: number, max?: number) =>
  [...new Array(max ? random(min, max) : min)] as unknown[]
