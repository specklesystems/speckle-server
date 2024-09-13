'use strict'

const knex = require('@/db/knex')
const { getStream } = require('@/modules/core/repositories/streams')
const crs = require('crypto-random-string')

const WebhooksEvents = () => knex('webhooks_events')
const Users = () => knex('users')

const { getServerInfo } = require('../../core/services/generic')

module.exports = {
  async dispatchStreamEvent({ streamId, event, eventPayload }, { trx } = {}) {
    // Add server info
    eventPayload.server = await getServerInfo()
    eventPayload.server.canonicalUrl = process.env.CANONICAL_URL
    delete eventPayload.server.id

    // Add stream info
    if (eventPayload.streamId) {
      eventPayload.stream = await getStream(
        {
          streamId: eventPayload.streamId,
          userId: eventPayload.userId
        },
        { trx }
      )
    }

    // Add user info (except email and pwd)
    if (eventPayload.userId) {
      eventPayload.user = await Users()
        .where({ id: eventPayload.userId })
        .select('*')
        .first()
      if (eventPayload.user) {
        delete eventPayload.user.passwordDigest
        delete eventPayload.user.email
      }
    }

    // with this select, we must have the streamid available on the webhook config,
    // even when the stream is deleted, to dispatch the stream deleted webhook events
    const { rows } = await knex.raw(
      `
      SELECT * FROM webhooks_config WHERE "streamId" = ?
    `,
      [streamId]
    )
    for (const wh of rows) {
      if (!wh.enabled) continue
      if (!(event in wh.triggers)) continue

      // Add webhook info (the key `webhook` will be replaced for each webhook configured, before serializing the payload and storing it)
      eventPayload.webhook = wh
      eventPayload.webhook.triggers = Object.keys(eventPayload.webhook.triggers)
      delete eventPayload.webhook.secret

      const q = WebhooksEvents().insert({
        id: crs({ length: 20 }),
        webhookId: wh.id,
        payload: JSON.stringify(eventPayload)
      })
      if (trx) q.transacting(trx)
      await q
    }
  },

  async getLastWebhookEvents({ webhookId, limit }) {
    if (!limit) {
      limit = 100
    }

    return await WebhooksEvents()
      .select('*')
      .where({ webhookId })
      .orderBy('lastUpdate', 'desc')
      .limit(limit)
  },

  async getWebhookEventsCount({ webhookId }) {
    const [res] = await WebhooksEvents().count().where({ webhookId })

    return parseInt(res.count)
  }
}
