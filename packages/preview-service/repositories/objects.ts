'use strict'

import { ObjectIdentifier } from 'domain/domain'
import knex from './knex'

const Objects = () => knex('objects')
const Closures = () => knex('object_children_closure')

type DbObject = {
  id: string
  data: unknown
}

export const getObject = async ({
  streamId,
  objectId
}: ObjectIdentifier): Promise<DbObject | null> => {
  const res = await Objects().where({ streamId, id: objectId }).select('*').first()
  if (!res) return null
  res.data.totalChildrenCount = res.totalChildrenCount
  delete res.streamId
  return <DbObject>res
}

export const getObjectChildrenStream = async ({
  streamId,
  objectId
}: ObjectIdentifier) => {
  const q = Closures()
  q.select('id')
  q.select(knex.raw('data::text as "dataText"'))
  q.rightJoin('objects', function () {
    this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
      'objects.id',
      '=',
      'object_children_closure.child'
    )
  })
    .where(
      knex.raw('object_children_closure."streamId" = ? AND parent = ?', [
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
export const getObjectsStream = async ({
  streamId,
  objectIds
}: BatchObjectIdentifier) => {
  const res = Objects()
    .whereIn('id', objectIds)
    .andWhere('streamId', streamId)
    .orderBy('id')
    .select(
      knex.raw(
        '"id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", data::text as "dataText"'
      )
    )
  return res.stream({ highWaterMark: 500 })
}
