'use strict'

const knex = require('@/db/knex')

const { dispatchStreamEvent } = require('../../webhooks/services/webhooks')
const StreamActivity = () => knex('stream_activity')
const StreamAcl = () => knex('stream_acl')

module.exports = {
  async saveActivity({
    streamId,
    resourceType,
    resourceId,
    actionType,
    userId,
    info,
    message
  }) {
    const dbObject = {
      streamId, // abc
      resourceType, // "commit"
      resourceId, // commit id
      actionType, // "commit_receive"
      userId, // populated by the api
      info: JSON.stringify(info), // can be anything with conventions! (TBD)
      message // something human understandable for frontend purposes mostly
    }
    await StreamActivity().insert(dbObject)
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
      dispatchStreamEvent({
        streamId,
        event: actionType,
        eventPayload: webhooksPayload
      })
    }
  },

  async getStreamActivity({ streamId, actionType, after, before, cursor, limit }) {
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
  },

  async getUserActivity({ userId, actionType, after, before, cursor, limit }) {
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
  },

  async getResourceActivity({
    resourceType,
    resourceId,
    actionType,
    after,
    before,
    cursor,
    limit
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
  },

  async getUserTimeline({ userId, after, before, cursor, limit }) {
    if (!limit) {
      limit = 200
    }

    let sqlFilters = ''
    const sqlVariables = []
    if (after) {
      sqlFilters += ' AND time > ?'
      sqlVariables.push(after)
    }
    if (before) {
      sqlFilters += ' AND time < ?'
      sqlVariables.push(before)
    }
    if (cursor) {
      sqlFilters += ' AND time < ?'
      sqlVariables.push(cursor)
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
  },

  async getActivityCountByResourceId({ resourceId, actionType, after, before }) {
    const query = StreamActivity().count().where({ resourceId })
    if (actionType) query.andWhere({ actionType })
    if (after) query.andWhere('time', '>', after)
    if (before) query.andWhere('time', '<', before)
    const [res] = await query
    return parseInt(res.count)
  },

  async getActivityCountByStreamId({ streamId, actionType, after, before }) {
    const query = StreamActivity().count().where({ streamId })
    if (actionType) query.andWhere({ actionType })
    if (after) query.andWhere('time', '>', after)
    if (before) query.andWhere('time', '<', before)
    const [res] = await query
    return parseInt(res.count)
  },

  async getActivityCountByUserId({ userId, actionType, after, before }) {
    const query = StreamActivity().count().where({ userId })
    if (actionType) query.andWhere({ actionType })
    if (after) query.andWhere('time', '>', after)
    if (before) query.andWhere('time', '<', before)
    const [res] = await query
    return parseInt(res.count)
  },

  async getTimelineCount({ userId, after, before }) {
    const query = StreamAcl()
      .count()
      .innerJoin('stream_activity', {
        'stream_acl.resourceId': 'stream_activity.streamId'
      })
      .where({ 'stream_acl.userId': userId })
    if (after) query.andWhere('stream_activity.time', '>', after)
    if (before) query.andWhere('stream_activity.time', '<', before)
    const [res] = await query
    return parseInt(res.count)
  }
}
