/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { IMockStore, IMocks, isRef } from '@graphql-tools/mock'
import { random } from 'lodash'

export type SpeckleModuleMocksConfig = {
  resolvers?: (params: {
    store: IMockStore
    helpers: ReturnType<typeof mockStoreHelpers>
  }) => Resolvers
  mocks?: IMocks
}

export const mockStoreHelpers = (store: IMockStore) => {
  const getId = (type: string, id: string) => `${type}:${id}`

  return {
    getId,
    getObject: <T = any>(type: string, id?: string) => store.get(type, id) as T,
    getObjectWithValues: <T = any>(type: string, values: Record<string, any>) => {
      console.log('a', values)
      return store.get(type, values) as T
    },
    getObjectField: <T = any>(type: string, id: string, field: string) =>
      store.get(type, getId(id, type), field) as T,
    getParentField: <T = any>(refOrParent: any, field: string) => {
      if (isRef(refOrParent)) return store.get(refOrParent, field) as T
      return refOrParent[field] as T
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
