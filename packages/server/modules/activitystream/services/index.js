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

  // Only `streamId` is mandatory, the rest are optional filters
  async getActivities( { streamId, timeStart, timeEnd, userId, actionType, resourceId } ) {
    let dbQuery = StreamActivity().where( { streamId: streamId } )
    if ( timeStart ) dbQuery.andWhere( 'time', '>', timeStart )
    if ( timeEnd ) dbQuery.andWhere( 'time', '<', timeEnd )
    if ( userId ) dbQuery.andWhere( { userId: userId } )
    if ( actionType ) dbQuery.andWhere( { actionType: actionType } )
    if ( resourceId ) dbQuery.andWhere( { resourceId: resourceId } )
    let results = await dbQuery.select( '*' )
    return results
  }
}
