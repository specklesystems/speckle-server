import type { ObjectIdentifier } from '@/domain/domain.js'
import type { Knex } from 'knex'
import type { PassThrough } from 'stream'

export const Objects = (deps: { db: Knex }) => deps.db<DbObject>('objects')

type DbObject = {
  id: string
  streamId: string
  data: object
  totalChildrenCount: number
}

type ReturnedObject = {
  id: string
  data: { totalChildrenCount: number } & Record<string, unknown>
}

export type GetObject = (params: ObjectIdentifier) => Promise<ReturnedObject | null>
export const getObjectFactory =
  (deps: { db: Knex }): GetObject =>
  async ({ streamId, objectId }) => {
    const { db } = deps
    const res = await Objects({ db })
      .where({ streamId, id: objectId })
      .select('*')
      .first()
    if (!res) return null
    const returned: ReturnedObject = {
      id: res.id,
      data: { totalChildrenCount: res.totalChildrenCount, ...res.data }
    }
    return returned
  }

export type GetObjectChildrenStream = (params: ObjectIdentifier) => Promise<PassThrough>
export const getObjectChildrenStreamFactory =
  (deps: { db: Knex }): GetObjectChildrenStream =>
  async ({ streamId, objectId }) => {
    const { db } = deps
    const q = db.with(
      'object_children_closure',
      db.raw(
        `SELECT objects.id as parent, d.key as child, d.value as mindepth, ? as "streamId"
        FROM objects
        JOIN jsonb_each_text(objects.data->'__closure') d ON true
        where objects.id = ?`,
        [streamId, objectId]
      )
    )
    await q.select('id')
    await q.select(db.raw('data::text as "dataText"'))
    await q.from('object_children_closure')

    await q
      .rightJoin('objects', function () {
        this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
          'objects.id',
          '=',
          'object_children_closure.child'
        )
      })
      .where(
        db.raw('object_children_closure."streamId" = ? AND parent = ?', [
          streamId,
          objectId
        ])
      )
      .orderBy('objects.id')
    return q.stream({ highWaterMark: 500 })
  }

type BatchObjectIdentifier = {
  streamId: string
  objectIds: string[]
}
export type GetObjectsStream = (params: BatchObjectIdentifier) => PassThrough
export const getObjectsStreamFactory =
  (deps: { db: Knex }): GetObjectsStream =>
  ({ streamId, objectIds }) => {
    const { db } = deps
    const res = Objects({ db })
      .whereIn('id', objectIds)
      .andWhere('streamId', streamId)
      .orderBy('id')
      .select(
        db.raw(
          '"id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", data::text as "dataText"'
        )
      )
    return res.stream({ highWaterMark: 500 })
  }
