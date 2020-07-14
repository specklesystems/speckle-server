'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Acl = ( ) => knex( 'stream_acl' )

module.exports = {

  async createStream( stream, ownerId ) {
    delete stream.createdAt
    stream.updatedAt = knex.fn.now( )
    stream.id = crs( { length: 10 } )

    let [ res ] = await Streams( ).returning( 'id' ).insert( stream )
    await Acl( ).insert( { userId: ownerId, resourceId: res, role: 'stream:owner' } )

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
    // upsert
    let query = Acl( ).insert( { userId: userId, resourceId: streamId, role: role } ).toString( ) + ` on conflict on constraint stream_acl_pkey do update set role=excluded.role`

    await knex.raw( query )
    return true
  },

  async revokePermissionsStream( streamId, userId ) {
    let streamAclEntriesCount = Acl( ).count( { resourceId: streamId } )
    // TODO: check if streamAclEntriesCount === 1 then throw big boo-boo (can't delete last ownership link)

    if ( streamAclEntriesCount === 1 )
      throw new Error( 'Stream has only one ownership link left - cannot revoke permissions.' )

    // TODO: below behaviour not correct. Flow:
    // Count owners 
    // If owner count > 1, then proceed to delete, otherwise throw an error (can't delete last owner - delete stream)

    let aclEntry = await Acl( ).where( { resourceId: streamId, userId: userId } ).select( '*' ).first( )

    if ( aclEntry.role === 'stream:owner' ) {
      let ownersCount = Acl( ).count( { resourceId: streamId, role: 'stream:owner' } )
      if ( ownersCount === 1 )
        throw new Error( 'Could not revoke permissions for user' )
      else {
        await Acl( ).where( { resourceId: streamId, userId: userId } ).del()
        return true
      }
    }

    let delCount = await Acl( ).where( { resourceId: streamId, userId: userId } ).del( )

    if ( delCount === 0 )
      throw new Error( 'Could not revoke permissions for user' )

    return true
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

  async getUserStreams( userId, offset, limit, publicOnly ) {
    offset = offset || 0
    limit = limit || 100
    publicOnly = publicOnly !== false //defaults to true if not provided

    let query = { userId: userId }

    if ( publicOnly ) query.isPublic = true

    return Acl( ).where( query )
      .rightJoin( 'streams', { 'streams.id': 'stream_acl.resourceId' } )
      .limit( limit ).offset( offset )
  },

  async getStreamUsers( streamId ) {
    return Acl( ).where( { resourceId: streamId } )
      .rightJoin( 'users', { 'users.id': 'stream_acl.userId' } )
      .select( 'role', 'username', 'name', 'id' )
  }
}