/* eslint-disable @typescript-eslint/no-explicit-any */

import { Nullable } from '@speckle/shared'
import { SchemaConfig, MetaSchemaConfig } from '@/modules/core/dbSchema'
import { camelCase, isString } from 'lodash'
import { Knex } from 'knex'

/**
 * All meta records must follow this interface
 */
export interface BaseMetaRecord<V = any> {
  key: string
  value: V
  createdAt: Date
  updatedAt: Date
}

/**
 * Helpers that simplify working with a DB table's associated meta table, if one exists
 */
export function metaHelpers<
  R extends BaseMetaRecord,
  S extends SchemaConfig<any, any, MetaSchemaConfig<any, keyof BaseMetaRecord, any>>
>(table: S, knex: Knex) {
  const db = <RR extends object = R>() => knex<RR>(table.meta.name)

  return {
    /**
     * Get a single value
     */
    get: async <RR extends R = R>(
      id: string,
      key: keyof S['meta']['metaKey']
    ): Promise<Nullable<RR>> => {
      const q = db()
        .where(table.meta.col.key, <string>key)
        .andWhere(table.meta.parentIdentityCol, id)
        .first()
      const res = (await q) as Nullable<RR>
      return res
    },
    /**
     * Get multiple values at once, keyed by ID
     * E.g.: {
     *  "1234": {
     *    "foo": ...,
     *    "bar": ...,
     *  }
     * }
     */
    getMultiple: async <RR extends R = R>(
      requests: Array<{ id: string; key: keyof S['meta']['metaKey'] }>
    ) => {
      const meta = table.meta.withoutTablePrefix
      const q = db()
        .select<Array<RR>>('*')
        .whereIn(
          table.meta.col.key,
          requests.map((r) => <string>r.key)
        )
        .whereIn(
          table.meta.parentIdentityCol,
          requests.map((r) => r.id)
        )

      const results = await q
      const ret: Record<string, Record<string, RR>> = {}
      for (const result of results) {
        const resultId = (result as Record<string, string>)[meta.parentIdentityCol]
        if (!ret[resultId]) {
          ret[resultId] = {}
        }

        const identityValues = ret[resultId]
        identityValues[result.key] = result as RR
      }

      return ret
    },
    /**
     * Set a value
     */
    set: async <RR extends R = R>(
      id: string,
      key: keyof S['meta']['metaKey'],
      val: any
    ) => {
      const meta = table.meta.withoutTablePrefix
      const q = db<any>()
        .insert({
          [meta.parentIdentityCol]: id,
          [meta.col.key]: key,
          [meta.col.value]: isString(val) ? JSON.stringify(val) : val,
          [meta.col.updatedAt]: new Date()
        })
        .onConflict([meta.parentIdentityCol, meta.col.key])
        .merge([meta.col.value, meta.col.updatedAt])
        .returning('*')
      const [newEntry] = (await q) as RR[]
      return newEntry
    },
    /**
     * Delete meta entry entirely
     */
    delete: async (id: string, key: keyof S['meta']['metaKey']) => {
      const q = db()
        .where(table.meta.col.key, <string>key)
        .andWhere(table.meta.parentIdentityCol, id)
        .del()
      const res = await q
      return res > 0
    },
    /**
     * Get unique GQL ID for the meta record
     */
    getGraphqlId: (record: R) => {
      const metaName = camelCase(table.meta.name)
      const entityId = (record as Record<string, unknown>)[
        table.meta.parentIdentityCol
      ] as string
      return `MetaValue/${metaName}/${entityId}/${record.key}`
    }
  }
}
