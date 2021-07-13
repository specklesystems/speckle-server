'use strict'

const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )
const crs = require( 'crypto-random-string' )

const WebhooksConfig = ( ) => knex( 'webhooks_config' )
const WebhooksEvents = ( ) => knex( 'webhooks_events' )

let MAX_STREAM_WEBHOOKS = 100

module.exports = {

  async createWebhook( { streamId, url, description, secret, enabled, events } ) {
    let streamWebhookCount = await module.exports.getStreamWebhooksCount( { streamId } )
    if ( streamWebhookCount >= MAX_STREAM_WEBHOOKS ) {
      throw new Error( `Maximum number of webhooks for a stream reached (${MAX_STREAM_WEBHOOKS})` )
    }

    let eventsObj = Object.assign( {}, ...events.map( ( x ) => ( { [x]: true } ) ) )

    let [ id ] = await WebhooksConfig( ).returning( 'id' ).insert( {
      id: crs( { length: 10 } ),
      streamId,
      url,
      description,
      secret,
      enabled,
      events: eventsObj
    } )
    return id
  },

  async getWebhook( { id } ) {
    let webhook = await WebhooksConfig().select( '*' ).where( { id } ).first()
    if ( webhook ) {
      webhook.events = Object.keys( webhook.events )
    }
    return webhook
  },

  async updateWebhook( { id, url, description, secret, enabled, events } ) {
    let fieldsToUpdate = {}
    if ( url !== undefined ) fieldsToUpdate.url = url
    if ( description !== undefined ) fieldsToUpdate.description = description
    if ( secret !== undefined ) fieldsToUpdate.secret = secret
    if ( enabled !== undefined ) fieldsToUpdate.enabled = enabled
    if ( events !== undefined ) {
      let eventsObj = Object.assign( {}, ...events.map( ( x ) => ( { [x]: true } ) ) )
      fieldsToUpdate.events = eventsObj
    }

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
    let webhooks = await WebhooksConfig( ).select( '*' ).where( { streamId } )
    for ( let webhook of webhooks ) {
      webhook.events = Object.keys( webhook.events )
    }
    return webhooks
  },

  async getStreamWebhooksCount( { streamId } ) {
    let [ res ] = await WebhooksConfig( ).count().where( { streamId } )
    return parseInt( res.count )
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
