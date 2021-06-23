'use strict'

const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const StreamActivity = ( ) => knex( 'stream_activity' )

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
  },

  async getStreamActivity( { streamId, timeEnd, limit } ) {
    if ( !limit ) {
      limit = 100
    }

    let dbQuery = StreamActivity().where( { streamId: streamId } )
    if ( timeEnd ) dbQuery.andWhere( 'time', '<', timeEnd )
    dbQuery.orderBy( 'time', 'desc' )
    dbQuery.limit( limit )

    let results = await dbQuery.select( '*' )

    return { items: results, cursor: results.length > 0 ? results[ results.length - 1 ].time.toISOString() : null }
  },

  async getUserActivity( { userId, timeEnd, limit } ) {
    if ( !limit ) {
      limit = 100
    }

    let dbQuery = StreamActivity().where( { userId: userId } )
    if ( timeEnd ) dbQuery.andWhere( 'time', '<', timeEnd )
    dbQuery.orderBy( 'time', 'desc' )
    dbQuery.limit( limit )

    let results = await dbQuery.select( '*' )
    return { items: results, cursor: results.length > 0 ? results[ results.length - 1 ].time.toISOString() : null }
  },

  async getResourceActivity( { resourceType, resourceId, timeEnd, limit } ) {
    if ( !limit ) {
      limit = 100
    }

    let dbQuery = StreamActivity().where( { resourceType, resourceId } )
    if ( timeEnd ) dbQuery.andWhere( 'time', '<', timeEnd )
    dbQuery.orderBy( 'time', 'desc' )
    dbQuery.limit( limit )

    let results = await dbQuery.select( '*' )
    return { items: results, cursor: results.length > 0 ? results[ results.length - 1 ].time.toISOString() : null }
  },

  async getUserTimeline( { userId, timeEnd, limit } ) {
    if ( !timeEnd ) {
      timeEnd = Date.now()
    }

    if ( !limit ) {
      limit = 100
    }

    let dbRawQuery = `
      SELECT act.*
      FROM stream_acl acl
      INNER JOIN stream_activity act ON acl."resourceId" = act."streamId"
      WHERE acl."userId" = ? AND time < ?
      ORDER BY time DESC
      LIMIT ?
    `

    let results = await knex.raw( dbRawQuery, [ userId, timeEnd, limit ] )
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
  }
}
