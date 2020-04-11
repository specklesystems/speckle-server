'use strict'
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Acl = ( ) => knex( 'stream_acl' )

module.exports = {

  createStream: async ( stream, ownerId ) => {
    delete stream.created_at
    stream.updated_at = knex.fn.now( )
    stream.id = crs( { length: 10 } )

    let [ res ] = await Streams( ).returning( 'id' ).insert( stream )
    await Acl( ).insert( { user_id: ownerId, resource_id: res, role: 'owner' } )

    return res
  },

  getStream: ( streamId ) => {
    return Streams( ).where( { id: streamId } ).first( )
  },

  updateStream: async ( streamId, stream ) => {
    delete stream.id
    delete stream.created_at
    let [ res ] = await Streams( ).returning( 'id' ).where( { id: streamId } ).update( stream )
    return res
  },

  grantPermissionsStream: async ( streamId, userId, role ) => {
    if ( role === 'owner' ) {
      let [ ownerAcl ] = await Acl( ).where( { resource_id: streamId, role: 'owner' } ).returning( '*' ).del( )
      await Acl( ).insert( { resource_id: streamId, user_id: ownerAcl.user_id, role: 'write' } )
    }

    // upsert
    let query = Acl( ).insert( { user_id: userId, resource_id: streamId, role: role } ).toString( ) + ` on conflict on constraint stream_acl_pkey do update set role=excluded.role`

    await knex.raw( query )
  },

  revokePermissionsStream: async ( streamId, userId ) => {
    let streamAclEntries = Acl( ).where( { resource_id: streamId } ).select( '*' )
    let delCount = await Acl( ).where( { resource_id: streamId, user_id: userId } ).whereNot( { role: 'owner' } ).del( )
    if ( delCount === 0 )
      throw new Error( 'Could not revoke permissions for user. Is he an owner?' )
  },

  async deleteStream( streamId ) {
    await Streams( ).where( { id: streamId } ).del( )
  },

  cloneStream: ( streamId, ownerId ) => {
    //TODO: 
    // Clone stream and all its references
    // Tags: easy clone
    // Branches: easy clone + 'branch_commits' JN table clone
    throw new Error( 'not implemented' )
  },

  getUserStreams: async ( userId, offset, limit ) => {
    offset = offset || 0
    limit = limit || 100

    return Acl( ).where( { user_id: userId } )
      .rightJoin( 'streams', { 'streams.id': 'stream_acl.resource_id' } )
      .limit( limit ).offset( offset )
  },

  getStreamUsers: async ( streamId ) => {
    return Acl( ).where( { resource_id: streamId } )
      .rightJoin( 'users', { 'users.id': 'stream_acl.user_id' } )
      .select( 'role', 'username', 'name', 'id' )
  }
}