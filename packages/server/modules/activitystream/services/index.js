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
  }
}
