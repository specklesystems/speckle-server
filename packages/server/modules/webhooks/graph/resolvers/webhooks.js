const appRoot = require( 'app-root-path' )
const { ForbiddenError } = require( 'apollo-server-express' )

const { authorizeResolver } = require( `${appRoot}/modules/shared` )
const { createWebhook, getWebhook, updateWebhook, deleteWebhook, getStreamWebhooks, getLastWebhookEvents, getWebhookEventsCount } = require( '../../services/webhooks' )


module.exports = {
  Stream: {
    async webhooks( parent, args, context, info ) {
      await authorizeResolver( context.userId, parent.id, 'stream:owner' )

      if ( args.id ) {
        let wh = await getWebhook( { id: args.id } )
        let items = wh ? [ wh ] : []
        return { items, totalCount: items.length }
      }

      let items = await getStreamWebhooks( { streamId: parent.id } )
      return { items, totalCount: items.length }
    }
  },

  Webhook: {
    async history( parent, args, context, info ) {
      let items = await getLastWebhookEvents( { webhookId: parent.id, limit: args.limit } )
      let totalCount = await getWebhookEventsCount( { webhookId: parent.id } )

      return { items, totalCount }
    }
  },

  Mutation: {
    async webhookCreate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.webhook.streamId, 'stream:owner' )

      let id = await createWebhook( { streamId: args.webhook.streamId, url: args.webhook.url, description: args.webhook.description, secret: args.webhook.secret, enabled: args.webhook.enabled !== false, triggers: args.webhook.triggers } )

      return id
    },
    async webhookUpdate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.webhook.streamId, 'stream:owner' )

      let wh = await getWebhook( { id: args.webhook.id } )
      if ( args.webhook.streamId !== wh.streamId )
        throw new ForbiddenError( 'The webhook id and stream id do not match. Please check your inputs.' )

      let updated = await updateWebhook( { id: args.webhook.id, url: args.webhook.url, description: args.webhook.description, secret: args.webhook.secret, enabled: args.webhook.enabled !== false, triggers: args.webhook.triggers } )

      return !!updated
    },
    async webhookDelete( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.webhook.streamId, 'stream:owner' )

      let wh = await getWebhook( { id: args.webhook.id } )
      if ( args.webhook.streamId !== wh.streamId )
        throw new ForbiddenError( 'The webhook id and stream id do not match. Please check your inputs.' )

      let deleted = await deleteWebhook( { id: args.webhook.id } )

      return !!deleted
    }
  }
}
