import type { Knex } from 'knex'
import type { ObjectIdentifier } from '@/domain/domain'

const Objects = (deps: { db: Knex }) => deps.db<DbObject>('objects')
const Closures = (deps: { db: Knex }) => deps.db('object_children_closure')

type DbObject = {
  id: string
  data: object
  totalChildrenCount: number
}

type ReturnedObject = Pick<DbObject, 'id'> & {
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

export type GetObjectChildrenStream = (
  params: ObjectIdentifier
) => NodeJS.ReadableStream
export const getObjectChildrenStreamFactory =
  (deps: { db: Knex }): GetObjectChildrenStream =>
  ({ streamId, objectId }) => {
    const { db } = deps
    const q = Closures({ db })
    q.select('id')
    q.select(db.raw('data::text as "dataText"'))
    q.rightJoin('objects', function () {
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
export type GetObjectsStream = (
  params: BatchObjectIdentifier
) => Promise<NodeJS.ReadableStream>
export const getObjectsStreamFactory =
  (deps: { db: Knex }): GetObjectsStream =>
  async ({ streamId, objectIds }) => {
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
