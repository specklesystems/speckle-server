const { authorizeResolver } = require('@/modules/shared')
const {
  getStreamWebhooks,
  getLastWebhookEvents,
  getWebhookEventsCount
} = require('../../services/webhooks')
const { Roles } = require('@speckle/shared')
const { getWebhookByIdFactory } = require('../../repositories/webhooks')
const { db } = require('@/db/knex')

const streamWebhooksResolver = async (parent, args, context) => {
  await authorizeResolver(
    context.userId,
    parent.id,
    Roles.Stream.Owner,
    context.resourceAccessRules
  )

  if (args.id) {
    const wh = await getWebhookByIdFactory({ db })({ id: args.id })
    const items = wh ? [wh] : []
    return { items, totalCount: items.length }
  }

  const items = await getStreamWebhooks({ streamId: parent.id })
  return { items, totalCount: items.length }
}

module.exports = {
  Stream: {
    webhooks: streamWebhooksResolver
  },

  Project: {
    webhooks: streamWebhooksResolver
  },

  Webhook: {
    projectId: (parent) => parent.streamId,
    hasSecret: (parent) => !!parent.secret?.length,
    async history(parent, args) {
      const items = await getLastWebhookEvents({
        webhookId: parent.id,
        limit: args.limit
      })
      const totalCount = await getWebhookEventsCount({ webhookId: parent.id })

      return { items, totalCount }
    }
  }
}
