import knex from '@/db/knex'
import {
  GetActiveUserStreams,
  GetActivityCountByResourceId,
  GetActivityCountByStreamId,
  GetActivityCountByUserId,
  GetResourceActivity,
  GetStreamActivity,
  GetTimelineCount,
  GetUserActivity,
  GetUserTimeline
} from '@/modules/activitystream/domain/operations'
import {
  StreamActivityRecord,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { StreamAcl, StreamActivity } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { StreamAclRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'

const tables = {
  streamActivity: <T extends object = StreamActivityRecord>(db: Knex) =>
    db<T>(StreamActivity.name),
  streamAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name)
}

export const getActivityFactory =
  ({ db }: { db: Knex }) =>
  async (
    streamId: string,
    start: Date,
    end: Date,
    filteredUser: string | null = null
  ): Promise<StreamScopeActivity[]> => {
    let query = tables
      .streamActivity<StreamScopeActivity>(db)
      .where(StreamActivity.col.streamId, '=', streamId)
      .whereBetween(StreamActivity.col.time, [start, end])
    if (filteredUser) query = query.andWhereNot(StreamActivity.col.userId, filteredUser)
    return await query
  }

export const getActiveUserStreamsFactory =
  ({ db }: { db: Knex }): GetActiveUserStreams =>
  async (start: Date, end: Date) => {
    const query = tables
      .streamAcl(db)
      .select(StreamActivity.col.userId)
      // creates the UserSteams type by aggregating the streamId-s, grouped by userId
      .select(
        knex.raw(`array_agg(distinct ${StreamActivity.name}."streamId") as "streamIds"`)
      )
      .groupBy(StreamActivity.col.userId)
      .join(
        StreamActivity.name,
        StreamActivity.col.streamId,
        '=',
        'stream_acl.resourceId'
      )
      .whereBetween(StreamActivity.col.time, [start, end])
      // make sure archived users do not counted for activity
      .join('server_acl', 'server_acl.userId', '=', StreamActivity.col.userId)
      .whereNot('server_acl.role', '=', Roles.Server.ArchivedUser)
    return (await query) as Awaited<ReturnType<GetActiveUserStreams>>
  }

export const getStreamActivityFactory =
  ({ db }: { db: Knex }): GetStreamActivity =>
  async ({ streamId, actionType, after, before, cursor, limit }) => {
    if (!limit) {
      limit = 200
    }

    const dbQuery = tables.streamActivity(db).where({ streamId })
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

export const getActivityCountByStreamIdFactory =
  ({ db }: { db: Knex }): GetActivityCountByStreamId =>
  async ({ streamId, actionType, after, before }) => {
    const query = tables.streamActivity(db).count().where({ streamId })
    if (actionType) query.andWhere({ actionType })
    if (after) query.andWhere('time', '>', after)
    if (before) query.andWhere('time', '<', before)
    const [res] = await query
    return parseInt(res.count.toString())
  }

export const getActivityCountByUserIdFactory =
  ({ db }: { db: Knex }): GetActivityCountByUserId =>
  async ({ userId, actionType, after, before }) => {
    const query = tables.streamActivity(db).count().where({ userId })
    if (actionType) query.andWhere({ actionType })
    if (after) query.andWhere('time', '>', after)
    if (before) query.andWhere('time', '<', before)
    const [res] = await query
    return parseInt(res.count.toString())
  }

export const getTimelineCountFactory =
  ({ db }: { db: Knex }): GetTimelineCount =>
  async ({ userId, after, before }) => {
    const query = tables
      .streamAcl(db)
      .count()
      .innerJoin('stream_activity', {
        'stream_acl.resourceId': 'stream_activity.streamId'
      })
      .where({ 'stream_acl.userId': userId })
    if (after) query.andWhere('stream_activity.time', '>', after)
    if (before) query.andWhere('stream_activity.time', '<', before)
    const [res] = await query
    return parseInt(res.count.toString())
  }

export const getActivityCountByResourceIdFactory =
  ({ db }: { db: Knex }): GetActivityCountByResourceId =>
  async ({ resourceId, actionType, after, before }) => {
    const query = tables.streamActivity(db).count().where({ resourceId })
    if (actionType) query.andWhere({ actionType })
    if (after) query.andWhere('time', '>', after)
    if (before) query.andWhere('time', '<', before)
    const [res] = await query
    return parseInt(res.count.toString())
  }

export const getUserTimelineFactory =
  ({ db }: { db: Knex }): GetUserTimeline =>
  async ({ userId, after, before, cursor, limit }) => {
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
    const results = (await db.raw(dbRawQuery, sqlVariables)).rows
    return {
      items: results,
      cursor: results.length > 0 ? results[results.length - 1].time.toISOString() : null
    }
  }

export const getResourceActivityFactory =
  ({ db }: { db: Knex }): GetResourceActivity =>
  async ({ resourceType, resourceId, actionType, after, before, cursor, limit }) => {
    if (!limit) {
      limit = 200
    }

    const dbQuery = tables.streamActivity(db).where({ resourceType, resourceId })
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

export const getUserActivityFactory =
  ({ db }: { db: Knex }): GetUserActivity =>
  async ({ userId, actionType, after, before, cursor, limit }) => {
    if (!limit) {
      limit = 200
    }

    const dbQuery = tables.streamActivity(db).where({ userId })
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
