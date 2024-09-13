'use strict'

const knex = require('@/db/knex')

const WebhooksEvents = () => knex('webhooks_events')

module.exports = {
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
