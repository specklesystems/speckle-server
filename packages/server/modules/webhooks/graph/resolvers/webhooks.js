const { createWebhook, getWebhook, updateWebhook, deleteWebhook, getStreamWebhooks, getLastWebhookEvents } = require( '../../services/webhooks' )


module.exports = {
  Stream: {
    async webhooks( parent, args, context, info ) {
      if ( args.id ) {
        let wh = await getWebhook( { id: args.id } )
        let items = wh ? [ wh ] : []
        return { items, totalCount: items.length }
      }

      let items = await getStreamWebhooks( { streamId: parent.id } )
      return { items, totalCount: items.length }
    }
  },

  Mutation: {
    async webhookCreate( parent, args, context, info ) {
      let id = await createWebhook( { streamId: args.webhook.streamId, url: args.webhook.url, description: args.webhook.description, secret: args.webhook.secret, enabled: args.webhook.enabled !== false, events: args.webhook.events } )

      return id
    },
    async webhookUpdate( parent, args, context, info ) {
      let updated = await updateWebhook( { id: args.webhook.id, url: args.webhook.url, description: args.webhook.description, secret: args.webhook.secret, enabled: args.webhook.enabled !== false, events: args.webhook.events } )

      return !!updated
    },
    async webhookDelete( parent, args, context, info ) {
      let deleted = await deleteWebhook( { id: args.id } )
      return !!deleted
    }
  }
}
