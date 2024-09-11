const {
  getLastWebhookEvents,
  getWebhookEventsCount
} = require('../../services/webhooks')

module.exports = {
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
