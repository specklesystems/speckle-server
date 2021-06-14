'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Acl = ( ) => knex( 'stream_acl' )

const debug = require( 'debug' )
const { createBranch } = require( './branches' )

module.exports = {

  async createStream( { name, description, isPublic, ownerId } ) {
    let stream = {
      id: crs( { length: 10 } ),
      name: name || 'Random Stream',
      description: description || 'No description provided.',
      isPublic: isPublic !== false,
      updatedAt: knex.fn.now( )
    }

    // Create the stream & set up permissions
    let [ streamId ] = await Streams( ).returning( 'id' ).insert( stream )
    await Acl( ).insert( { userId: ownerId, resourceId: streamId, role: 'stream:owner' } )

    // Create a default main branch
    await createBranch( { name: 'main', description: 'default branch', streamId: streamId, authorId: ownerId } )
    return streamId
  },

  async getStream( { streamId, userId } ) {
    let stream = await Streams( ).where( { id: streamId } ).select( '*' ).first( )
    if ( !userId )
      return stream

    let acl = await Acl().where( { resourceId: streamId, userId: userId } ).select( 'role' ).first()
    if ( acl ) stream.role = acl.role
    return stream
  },

  async updateStream( { streamId, name, description, isPublic } ) {
    let [ res ] = await Streams( )
      .returning( 'id' )
      .where( { id: streamId } )
      .update( { name, description, isPublic, updatedAt: knex.fn.now() } )
    return res
  },

  async grantPermissionsStream( { streamId, userId, role } ) {
    // upserts the existing role (sets a new one!)
    // TODO: check if we're removing the last owner (ie, does the stream still have an owner after this operation)?
    let query = Acl( ).insert( { userId: userId, resourceId: streamId, role: role } ).toString( ) + ' on conflict on constraint stream_acl_pkey do update set role=excluded.role'

    await knex.raw( query )

    // update stream updated at
    await Streams().where( { id: streamId } ).update( { updatedAt: knex.fn.now() } )
    return true
  },

  async revokePermissionsStream( { streamId, userId } ) {
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
        await Acl( ).where( { resourceId: streamId, userId: userId } ).del( )
        return true
      }
    }

    let delCount = await Acl( ).where( { resourceId: streamId, userId: userId } ).del( )

    if ( delCount === 0 )
      throw new Error( 'Could not revoke permissions for user' )

    // update stream updated at
    await Streams().where( { id: streamId } ).update( { updatedAt: knex.fn.now() } )

    return true
  },

  async deleteStream( { streamId } ) {
    debug( 'speckle:db' )( 'Deleting stream ' + streamId )

    // Delete stream commits (not automatically cascaded)
    await knex.raw(
      `
      DELETE FROM commits WHERE id IN (
        SELECT sc."commitId" FROM streams s
        INNER JOIN stream_commits sc ON s.id = sc."streamId"
        WHERE s.id = ?
      )
      `,
      [ streamId ]
    )
    return await Streams( ).where( { id: streamId } ).del( )
  },

  async getUserStreams( { userId, limit, cursor, publicOnly, searchQuery } ) {
    limit = limit || 25
    publicOnly = publicOnly !== false //defaults to true if not provided

    let query = Acl( )
      .columns( [ { id: 'streams.id' }, 'name', 'description', 'isPublic', 'createdAt', 'updatedAt', 'role' ] ).select( )
      .join( 'streams', 'stream_acl.resourceId', 'streams.id' )
      .where( 'stream_acl.userId', userId )

    if ( cursor )
      query.andWhere( 'streams.updatedAt', '<', cursor )

    if ( publicOnly )
      query.andWhere( 'streams.isPublic', true )

    if ( searchQuery )
      query.andWhere( function () {
        this.where( 'name', 'ILIKE', `%${ searchQuery }%` )
          .orWhere( 'description', 'ILIKE', `%${searchQuery}%` )
          .orWhere( 'id', 'ILIKE', `%${searchQuery}%` ) //potentially useless?
      } )

    query.orderBy( 'streams.updatedAt', 'desc' ).limit( limit )

    let rows = await query
    return { streams: rows, cursor: rows.length > 0 ? rows[ rows.length - 1 ].updatedAt.toISOString( ) : null }
  },

  async getUserStreamsCount( { userId, publicOnly, searchQuery } ) {
    publicOnly = publicOnly !== false //defaults to true if not provided

    let query = Acl( ).count( )
      .join( 'streams', 'stream_acl.resourceId', 'streams.id' )
      .where( { userId: userId } )

    if ( publicOnly )
      query.andWhere( 'streams.isPublic', true )

    if ( searchQuery )
      query.andWhere( function () {
        this.where( 'name', 'ILIKE', `%${searchQuery}%` )
          .orWhere( 'description', 'ILIKE', `%${searchQuery}%` )
          .orWhere( 'id', 'ILIKE', `%${searchQuery}%` ) //potentially useless?
      } )

    let [ res ] = await query
    return parseInt( res.count )
  },

  async getStreamUsers( { streamId } ) {
    let query =
      Acl( ).columns( { role: 'stream_acl.role' }, 'id', 'name', 'company', 'avatar' ).select( )
        .where( { resourceId: streamId } )
        .rightJoin( 'users', { 'users.id': 'stream_acl.userId' } )
        .select( 'stream_acl.role', 'name', 'id', 'company', 'avatar' )
        .orderBy( 'stream_acl.role' )

    return await query
  }
}
