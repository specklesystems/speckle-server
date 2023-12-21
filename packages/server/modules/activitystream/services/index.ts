'use strict'

import knex from '@/db/knex'
import type { Knex } from 'knex'

import { dispatchStreamEvent } from '@/modules/webhooks/services/webhooks'
const StreamActivity = () => knex('stream_activity')
const StreamAcl = () => knex('stream_acl')

/**
 * @param {Omit<import('@/modules/activitystream/helpers/types').StreamActivityRecord, "time">} param0
 * @param {{trx?: import('knex').Knex.Transaction}} param1
 */
export async function saveActivity(
  {
    streamId,
    resourceType,
    resourceId,
    actionType,
    userId,
    info,
    message
  }: {
    streamId: string | null
    resourceType: string
    resourceId: string | null
    actionType: string
    userId: string | null
    info: unknown
    message: string
  },
  { trx }: { trx?: Knex.Transaction } = {}
) {
  const dbObject = {
    streamId, // abc
    resourceType, // "commit"
    resourceId, // commit id
    actionType, // "commit_receive"
    userId, // populated by the api
    info: JSON.stringify(info), // can be anything with conventions! (TBD)
    message // something human understandable for frontend purposes mostly
  }

  const q = StreamActivity().insert(dbObject)
  if (trx) q.transacting(trx)
  await q

  if (streamId) {
    const webhooksPayload = {
      streamId,
      userId,
      activityMessage: message,
      event: {
        // eslint-disable-next-line camelcase
        event_name: actionType,
        data: info
      }
    }

    await dispatchStreamEvent(
      {
        streamId,
        event: actionType,
        eventPayload: webhooksPayload
      },
      { trx }
    )
  }
}

export async function getStreamActivity({
  streamId,
  actionType,
  after,
  before,
  cursor,
  limit
}: {
  streamId: string
  actionType?: string
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) {
  if (!limit) {
    limit = 200
  }

  const dbQuery = StreamActivity().where({ streamId })
  if (actionType) dbQuery.andWhere({ actionType })
  if (after) dbQuery.andWhere('time', '>', after)
  if (before) dbQuery.andWhere('time', '<', before)
  if (cursor) dbQuery.andWhere('time', '<', cursor)
  dbQuery.orderBy('time', 'desc').limit(limit)

  const results = await dbQuery.select('*')

  return {
    items: results,
    cursor: results.length > 0 ? results[results.length - 1].time.toISOString() : null
  }
}

export async function getUserActivity({
  userId,
  actionType,
  after,
  before,
  cursor,
  limit
}: {
  userId: string
  actionType?: string
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) {
  if (!limit) {
    limit = 200
  }

  const dbQuery = StreamActivity().where({ userId })
  if (actionType) dbQuery.andWhere({ actionType })
  if (after) dbQuery.andWhere('time', '>', after)
  if (before) dbQuery.andWhere('time', '<', before)
  if (cursor) dbQuery.andWhere('time', '<', cursor)
  dbQuery.orderBy('time', 'desc').limit(limit)

  const results = await dbQuery.select('*')
  return {
    items: results,
    cursor: results.length > 0 ? results[results.length - 1].time.toISOString() : null
  }
}

export async function getResourceActivity({
  resourceType,
  resourceId,
  actionType,
  after,
  before,
  cursor,
  limit
}: {
  resourceType: string
  resourceId: string
  actionType?: string
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) {
  if (!limit) {
    limit = 200
  }

  const dbQuery = StreamActivity().where({ resourceType, resourceId })
  if (actionType) dbQuery.andWhere({ actionType })
  if (after) dbQuery.andWhere('time', '>', after)
  if (before) dbQuery.andWhere('time', '<', before)
  if (cursor) dbQuery.andWhere('time', '<', cursor)
  dbQuery.orderBy('time', 'desc').limit(limit)

  const results = await dbQuery.select('*')
  return {
    items: results,
    cursor: results.length > 0 ? results[results.length - 1].time.toISOString() : null
  }
}

export async function getUserTimeline({
  userId,
  after,
  before,
  cursor,
  limit
}: {
  userId: string
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) {
  if (!limit) {
    limit = 200
  }

  let sqlFilters = ''
  const sqlVariables = []
  if (after) {
    sqlFilters += ' AND time > ?'
    sqlVariables.push(after)
  }
  if (before || cursor) {
    sqlFilters += ' AND time < ?'
    sqlVariables.push(before || cursor)
  }

  const dbRawQuery = `
      SELECT act.*
      FROM stream_acl acl
      INNER JOIN stream_activity act ON acl."resourceId" = act."streamId"
      WHERE acl."userId" = ? ${sqlFilters}
      ORDER BY time DESC
      LIMIT ?
    `

  sqlVariables.unshift(userId)
  sqlVariables.push(limit)
  const results = (await knex.raw(dbRawQuery, sqlVariables)).rows
  return {
    items: results,
    cursor: results.length > 0 ? results[results.length - 1].time.toISOString() : null
  }
}

export async function getActivityCountByResourceId({
  resourceId,
  actionType,
  after,
  before
}: {
  resourceId: string
  actionType?: string
  after?: Date
  before?: Date
}) {
  const query = StreamActivity().count().where({ resourceId })
  if (actionType) query.andWhere({ actionType })
  if (after) query.andWhere('time', '>', after)
  if (before) query.andWhere('time', '<', before)
  const [res] = await query
  if (typeof res.count === 'number') return res.count
  return parseInt(res.count)
}

export async function getActivityCountByStreamId({
  streamId,
  actionType,
  after,
  before
}: {
  streamId: string
  actionType?: string
  after?: Date
  before?: Date
}) {
  const query = StreamActivity().count().where({ streamId })
  if (actionType) query.andWhere({ actionType })
  if (after) query.andWhere('time', '>', after)
  if (before) query.andWhere('time', '<', before)
  const [res] = await query
  if (typeof res.count === 'number') return res.count
  return parseInt(res.count)
}

export async function getActivityCountByUserId({
  userId,
  actionType,
  after,
  before
}: {
  userId: string
  actionType?: string
  after?: Date
  before?: Date
}) {
  const query = StreamActivity().count().where({ userId })
  if (actionType) query.andWhere({ actionType })
  if (after) query.andWhere('time', '>', after)
  if (before) query.andWhere('time', '<', before)
  const [res] = await query
  if (typeof res.count === 'number') return res.count
  return parseInt(res.count)
}

export async function getTimelineCount({
  userId,
  after,
  before
}: {
  userId: string
  after?: Date
  before?: Date
}) {
  const query = StreamAcl()
    .count()
    .innerJoin('stream_activity', {
      'stream_acl.resourceId': 'stream_activity.streamId'
    })
    .where({ 'stream_acl.userId': userId })
  if (after) query.andWhere('stream_activity.time', '>', after)
  if (before) query.andWhere('stream_activity.time', '<', before)
  const [res] = await query
  if (typeof res.count === 'number') return res.count
  return parseInt(res.count)
}
