'use strict'

const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const { dispatchStreamEvent } = require( '../../webhooks/services/webhooks' )
const StreamActivity = () => knex( 'stream_activity' )
const StreamAcl = ( ) => knex( 'stream_acl' )

module.exports = {

  async saveActivity( { streamId, resourceType, resourceId, actionType, userId, info, message } ) {
    let dbObject = {
      streamId,
      resourceType,
      resourceId,
      actionType,
      userId,
      info: JSON.stringify( info ),
      message
    }
    await StreamActivity( ).insert( dbObject )
    if ( streamId ) {
      let webhooksPayload = {
        streamId: streamId,
        userId: userId,
        activityMessage: message,
        event: {
          'event_name': actionType,
          'data': info
        }
      }
      dispatchStreamEvent( { streamId, event: actionType, eventPayload: webhooksPayload } )
    }
  },

  async getStreamActivity( { streamId, actionType, after, before, limit } ) {
    if ( !limit ) {
      limit = 200
    }

    let dbQuery = StreamActivity().where( { streamId: streamId } )
    if ( actionType ) dbQuery.andWhere( { actionType: actionType } )
    if ( after ) dbQuery.andWhere( 'time', '>', after )
    if ( before ) dbQuery.andWhere( 'time', '<', before )
    dbQuery.orderBy( 'time', 'desc' ).limit( limit )

    let results = await dbQuery.select( '*' )

    return { items: results, cursor: results.length > 0 ? results[ results.length - 1 ].time.toISOString() : null }
  },

  async getUserActivity( { userId, actionType, after, before, limit } ) {
    if ( !limit ) {
      limit = 200
    }

    let dbQuery = StreamActivity().where( { userId: userId } )
    if ( actionType ) dbQuery.andWhere( { actionType: actionType } )
    if ( after ) dbQuery.andWhere( 'time', '>', after )
    if ( before ) dbQuery.andWhere( 'time', '<', before )
    dbQuery.orderBy( 'time', 'desc' ).limit( limit )

    let results = await dbQuery.select( '*' )
    return { items: results, cursor: results.length > 0 ? results[ results.length - 1 ].time.toISOString() : null }
  },

  async getResourceActivity( { resourceType, resourceId, actionType, after, before, limit } ) {
    if ( !limit ) {
      limit = 200
    }

    let dbQuery = StreamActivity().where( { resourceType, resourceId } )
    if ( actionType ) dbQuery.andWhere( { actionType: actionType } )
    if ( after ) dbQuery.andWhere( 'time', '>', after )
    if ( before ) dbQuery.andWhere( 'time', '<', before )
    dbQuery.orderBy( 'time', 'desc' ).limit( limit )

    let results = await dbQuery.select( '*' )
    return { items: results, cursor: results.length > 0 ? results[ results.length - 1 ].time.toISOString() : null }
  },

  async getUserTimeline( { userId, before, limit } ) {
    if ( !limit ) {
      limit = 200
    }

    if ( !before ) {
      before = new Date()
    }

    let dbRawQuery = `
      SELECT act.*
      FROM stream_acl acl
      INNER JOIN stream_activity act ON acl."resourceId" = act."streamId"
      WHERE acl."userId" = ? AND time < ?
      ORDER BY time DESC
      LIMIT ?
    `

    let results = ( await knex.raw( dbRawQuery, [ userId, before, limit ] ) ).rows
    return { items: results, cursor: results.length > 0 ? results[ results.length - 1 ].time.toISOString() : null }
  },

  async getActivityCountByResourceId( { resourceId } ) {
    let [ res ] = await StreamActivity().count().where( { resourceId } )
    return parseInt( res.count )
  },

  async getActivityCountByStreamId( { streamId } ) {
    let [ res ] = await StreamActivity().count().where( { streamId } )
    return parseInt( res.count )
  },

  async getActivityCountByUserId( { userId } ) {
    let [ res ] = await StreamActivity().count().where( { userId } )
    return parseInt( res.count )
  },

  async getTimelineCount( { userId } ) {
    let [ res ] = await StreamAcl().count()
      .innerJoin( 'stream_activity', { 'stream_acl.resourceId': 'stream_activity.streamId' } )
      .where( { 'stream_acl.userId': userId } )

    return parseInt( res.count )
  }
}
