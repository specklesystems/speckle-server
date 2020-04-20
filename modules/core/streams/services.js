'use strict'
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Acl = ( ) => knex( 'stream_acl' )

module.exports = {

  async createStream( stream, ownerId ) {
    delete stream.createdAt
    stream.updatedAt = knex.fn.now( )
    stream.id = crs( { length: 10 } )

    let [ res ] = await Streams( ).returning( 'id' ).insert( stream )
    await Acl( ).insert( { userId: ownerId, resourceId: res, role: 'owner' } )

    return res
  },

  async getStream( streamId, userId ) {
    if ( !userId )
      return Streams( ).where( { id: streamId } ).select( '*' ).first( )

    let stream = await Streams( ).where( { id: streamId } ).select( '*' ).first( )
    let { role } = ( await Acl( ).where( { userId: userId, resourceId: streamId } ).select( 'role' ).first( ) ) || {}
    
    stream.role = role
    return stream
  },

  async updateStream( stream ) {
    delete stream.createdAt
    let [ res ] = await Streams( ).returning( 'id' ).where( { id: stream.id } ).update( stream )
    return res
  },

  async grantPermissionsStream( streamId, userId, role ) {
    if ( role === 'owner' ) {
      let [ ownerAcl ] = await Acl( ).where( { resourceId: streamId, role: 'owner' } ).returning( '*' ).del( )
      await Acl( ).insert( { resourceId: streamId, userId: ownerAcl.userId, role: 'write' } )
    }

    // upsert
    let query = Acl( ).insert( { userId: userId, resourceId: streamId, role: role } ).toString( ) + ` on conflict on constraint stream_acl_pkey do update set role=excluded.role`

    await knex.raw( query )
  },

  async revokePermissionsStream( streamId, userId ) {
    let streamAclEntries = Acl( ).where( { resourceId: streamId } ).select( '*' )
    let delCount = await Acl( ).where( { resourceId: streamId, userId: userId } ).whereNot( { role: 'owner' } ).del( )
    if ( delCount === 0 )
      throw new Error( 'Could not revoke permissions for user. Is he an owner?' )
  },

  async deleteStream( streamId ) {
    await Streams( ).where( { id: streamId } ).del( )
  },

  async cloneStream( streamId, ownerId ) {
    //TODO: 
    // Clone stream and all its references
    // Tags: easy clone
    // Branches: easy clone + 'branch_commits' JN table clone
    throw new Error( 'not implemented' )
  },

  async getUserStreams( userId, offset, limit ) {
    offset = offset || 0
    limit = limit || 100

    return Acl( ).where( { userId: userId } )
      .rightJoin( 'streams', { 'streams.id': 'stream_acl.resourceId' } )
      .limit( limit ).offset( offset )
  },

  async getStreamUsers( streamId ) {
    return Acl( ).where( { resourceId: streamId } )
      .rightJoin( 'users', { 'users.id': 'stream_acl.userId' } )
      .select( 'role', 'username', 'name', 'id' )
  }
}