'use strict'

const knex = require('@/db/knex')

const { dispatchStreamEventFactory } = require('@/modules/webhooks/services/webhooks')
const { getStream } = require('@/modules/core/repositories/streams')
const {
  createWebhookEventFactory
} = require('@/modules/webhooks/repositories/webhooks')
const { getUser } = require('@/modules/core/repositories/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const StreamActivity = () => knex('stream_activity')

module.exports = {
  /**
   * @param {Omit<import('@/modules/activitystream/helpers/types').StreamActivityRecord, "time">} param0
   * @param {{trx?: import('knex').Knex.Transaction}} param1
   */
  async saveActivity(
    { streamId, resourceType, resourceId, actionType, userId, info, message },
    { trx } = {}
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

      await dispatchStreamEventFactory({
        db: trx ?? knex.db,
        getServerInfo,
        getStream,
        createWebhookEvent: createWebhookEventFactory({ db: knex.db }),
        getUser
      })(
        {
          streamId,
          event: actionType,
          eventPayload: webhooksPayload
        },
        { trx }
      )
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
  }
}
