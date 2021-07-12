'use strict'

const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )
const crs = require( 'crypto-random-string' )

const WebhooksConfig = ( ) => knex( 'webhooks_config' )
const WebhooksEvents = ( ) => knex( 'webhooks_events' )

module.exports = {

  async createWebhook( { streamId, url, description, secret, enabled, events } ) {
    // TODO: limit max number of webhooks for a stream to 100 (github has a 20 limit per event)

    let [ id ] = await WebhooksConfig( ).returning( 'id' ).insert( {
      id: crs( { length: 10 } ),
      streamId,
      url,
      description,
      secret,
      enabled,
      events: events
    } )
    return id
  },

  async getWebhook( { id } ) {
    // TODO: get webhook object + summary of event history (last event status, etc)
    return await WebhooksConfig().select( '*' ).where( { id } ).first()
  },

  async updateWebhook( { id, url, description, secret, enabled, events } ) {
    let fieldsToUpdate = {}
    if ( url !== undefined ) fieldsToUpdate.url = url
    if ( description !== undefined ) fieldsToUpdate.description = description
    if ( secret !== undefined ) fieldsToUpdate.secret = secret
    if ( enabled !== undefined ) fieldsToUpdate.enabled = enabled
    if ( events !== undefined ) fieldsToUpdate.events = events

    let [ res ] = await WebhooksConfig( )
      .returning( 'id' )
      .where( { id } )
      .update( fieldsToUpdate )
    return res
  },

  async deleteWebhook( { id } ) {
    return await WebhooksConfig( ).where( { id } ).del( )
  },

  async getStreamWebhooks( { streamId } ) {
    // TODO: also get summary of event history for each webhook (last event status, etc)
    return await WebhooksConfig( ).select( '*' ).where( { streamId } )
  },

  async dispatchStreamEvent( { streamId, event, eventPayload } ) {
    let { rows } = await knex.raw( `
      SELECT * FROM webhooks_config WHERE "streamId" = ?
    `, [ streamId ] )
    for ( let wh of rows ) {
      if ( !( event in wh.events ) )
        continue

      await WebhooksEvents( ).insert( {
        id: crs( { length: 20 } ),
        webhookId: wh.id,
        payload: eventPayload
      } )
    }
  },

  async getLastWebhookEvents( { webhookId, limit } ) {
    if ( !limit ) {
      limit = 100
    }

    return await WebhooksEvents( ).select( '*' ).where( { webhookId } ).orderBy( 'lastUpdate', 'desc' ).limit( limit )
  },

  async getWebhookEventsCount( { webhookId } ) {
    let [ res ] = await WebhooksEvents().count().where( { webhookId } )

    return parseInt( res.count )
  }
}
