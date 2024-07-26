/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { IMockStore, IMocks, isRef, Ref } from '@graphql-tools/mock'
import { isObjectLike, random } from 'lodash'

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
  return {
    /**
     * Get mock reference. It can be returned from resolvers and converted to the actual mock
     * when outputted to response.
     */
    getMockRef: <T = any>(
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
    },
    /**
     * Get value from a mock reference or plain object.
     *
     * Useful when you need to access something from parent, where you don't know if it's
     * gonna be a mock reference or the actual object.
     * Also useful for just getting arbitrary field values from mock refs.
     */
    getFieldValue: <T = any>(
      refOrObj: Record<string, unknown> | Ref | SimpleRef,
      field: string
    ) => {
      if (isRef(refOrObj)) return store.get(refOrObj, field) as T
      if (isSimpleRef(refOrObj))
        return store.get(refOrObj.type, refOrObj.id, field) as T
      return refOrObj[field] as T
    }
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
