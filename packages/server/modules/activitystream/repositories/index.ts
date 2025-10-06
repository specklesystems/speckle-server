import type {
  GetActivities,
  GetActivityCountByResourceId,
  GetActivityCountByStreamId,
  GetActivityCountByUserId,
  GetResourceActivity,
  GetStreamActivity,
  GetTimelineCount,
  GetUserActivity,
  GetUserTimeline,
  SaveActivity,
  SaveStreamActivity
} from '@/modules/activitystream/domain/operations'
import type { StreamActivityRecord } from '@/modules/activitystream/helpers/types'
import {
  Activity as ActivityModel,
  StreamAcl,
  StreamActivity
} from '@/modules/core/dbSchema'
import type { StreamAclRecord } from '@/modules/core/helpers/types'
import {
  createWebhookEventFactory,
  getStreamWebhooksFactory
} from '@/modules/webhooks/repositories/webhooks'
import { dispatchStreamEventFactory } from '@/modules/webhooks/services/webhooks'
import type { Knex } from 'knex'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import cryptoRandomString from 'crypto-random-string'
import type { Activity } from '@/modules/activitystream/domain/types'

const tables = {
  streamActivity: <T extends object = StreamActivityRecord>(db: Knex) =>
    db<T>(StreamActivity.name),
  streamAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name)
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

// TODO: this function should be a service
export const saveStreamActivityFactory =
  ({ db }: { db: Knex }): SaveStreamActivity =>
  async ({ streamId, resourceType, resourceId, actionType, userId, info, message }) => {
    const dbObject = {
      streamId, // abc
      resourceType, // "commit"
      resourceId, // commit id
      actionType, // "commit_receive"
      userId, // populated by the api
      info: JSON.stringify(info), // can be anything with conventions! (TBD)
      message: message?.slice(0, 255) ?? message // something human understandable for frontend purposes mostly
    }

    await tables
      .streamActivity<Omit<StreamActivityRecord, 'info'> & { info: string }>(db)
      .insert(dbObject)

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

      const projectDb = await getProjectDbClient({ projectId: streamId })
      // yes, we're manually instantiating this thing here, but i do not want to go through all the places,
      // where we're calling saveActivity!
      // the whole activity module will need to be refactored to use the eventBus
      await dispatchStreamEventFactory({
        getStreamWebhooks: getStreamWebhooksFactory({ db: projectDb }),
        getServerInfo: getServerInfoFactory({ db }),
        getStream: getStreamFactory({ db: projectDb }),
        createWebhookEvent: createWebhookEventFactory({ db: projectDb }),
        getUser: getUserFactory({ db })
      })({
        streamId,
        event: actionType,
        eventPayload: webhooksPayload
      })
    }
  }

export const saveActivityFactory =
  ({ db }: { db: Knex }): SaveActivity =>
  async (activity) => {
    const id = cryptoRandomString({ length: 10 })
    const createdAt = new Date()

    const [result] = await db<typeof activity & { id: string; createdAt: Date }>(
      ActivityModel.name
    ).insert({ ...activity, id, createdAt }, '*')

    return result
  }

export const getActivitiesFactory =
  ({ db }: { db: Knex }): GetActivities =>
  async (filters = {}): Promise<Activity[]> => {
    const { workspaceId, projectId, eventType, userId } = filters

    const q = db<Activity>(ActivityModel.name).select('*')

    if (projectId) {
      q.where(ActivityModel.col.contextResourceId, projectId).andWhere(
        ActivityModel.col.contextResourceType,
        'project'
      )
    }

    if (workspaceId) {
      q.where(ActivityModel.col.contextResourceId, workspaceId).andWhere(
        ActivityModel.col.contextResourceType,
        'workspace'
      )
    }

    if (eventType) {
      q.andWhere(ActivityModel.col.eventType, eventType)
    }

    if (userId) {
      q.andWhere(ActivityModel.col.userId, userId)
    }

    return await q
  }
