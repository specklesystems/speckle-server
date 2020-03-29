'use strict'

const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Acl = ( ) => knex( 'stream_acl' )

module.exports = {
  createStream: async ( stream, ownerId ) => {
    delete stream.id
    delete stream.created_at
    stream.updated_at = knex.fn.now( )

    let [ res ] = await Streams( ).returning( 'id' ).insert( stream )
    await Acl( ).insert( { user_id: ownerId, stream_id: res, role: 'owner' } )

    return res
  },

  getStream: ( streamId ) => {
    return Streams( ).where( { id: streamId } ).first( )
  },

  /**
   * @param  {string} The streamId you want to update
   * @param  {object} The stream fields you want to update
   * @return {string} the id of the updated stream
   */
  updateStream: async ( streamId, stream ) => {
    delete stream.id
    delete stream.created_at
    let [ res ] = await Streams( ).returning( 'id' ).where( { id: streamId } ).update( stream )
    return res
  },

  grantPermissionsStream: async ( streamId, userId, role ) => {
    if ( role === 'owner' ) {
      let [ ownerAcl ] = await Acl( ).where( { stream_id: streamId, role: 'owner' } ).returning( '*' ).del( )
      await Acl( ).insert( { stream_id: streamId, user_id: ownerAcl.user_id, role: 'write' } )
    }

    // upsert
    let query = Acl( ).insert( { user_id: userId, stream_id: streamId, role: role } ).toString( ) + ` on conflict on constraint stream_acl_pkey do update set role=excluded.role`

    await knex.raw( query )


  },

  revokePermissionsStream: async ( streamId, userId ) => {
    let streamAclEntries = Acl( ).where( { stream_id: streamId } ).select( '*' )
    let delCount = await Acl( ).where( { stream_id: streamId, user_id: userId } ).whereNot( { role: 'owner' } ).del( )
    if ( delCount === 0 )
      throw new Error( 'Could not revoke permissions for user. Is he an owner?' )
  },

  deleteStream: ( streamId ) => {
    // TODO: cascade through everything...
    throw new Error( 'not implemented' )
  },

  cloneStream: ( streamId, ownerId ) => {
    //TODO: 
    // Clone stream and all its references
    // Tags: easy clone
    // Branches: easy clone + 'branch_commits' JN table clone
    throw new Error( 'not implemented' )
  },

  getStreamsUser: async ( userId, offset, limit ) => {
    offset = offset || 0
    limit = limit || 100

    return Acl( ).where( { user_id: userId } )
      .rightJoin( 'streams', { 'streams.id': 'stream_acl.stream_id' } )
      .limit( limit ).offset( offset )
  },
}