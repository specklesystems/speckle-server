'use strict'
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
const root = require( 'app-root-path' )
const { createStream, getStream, updateStream, deleteStream, getUserStreams, getStreamUsers, grantPermissionsStream, revokePermissionsStream } = require( '../../services/streams' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${root}/modules/shared` )

module.exports = {
  Query: {
    async stream( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:read' )
      await authorizeResolver( context.userId, args.id, 'stream:reviewer' )

      let stream = await getStream( args.id, context.userId )
      return stream
    }
  },
  Stream: {
    async users( parent, args, context, info ) {
      let users = await getStreamUsers( parent.id )
      return users
    }
  },
  User: {
    async streamCollection( parent, args, context, info ) {
      // TODO: Return only the user's public streams if parent.id !== context.userId
      let publicOnly = parent.id !== context.userId
      let streams = await getUserStreams( parent.id, args.offset, args.limit, publicOnly )
      // TODO: Implement offsets in service, not in friggin array slice
      return { totalCount: streams.length, streams: streams.slice( args.offset, args.offset + args.limit ) }
    }
  },
  Mutation: {
    async streamCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )

      let id = await createStream( args.stream, context.userId )
      return id
    },
    async streamUpdate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.stream.id, 'stream:owner' )
      await updateStream( args.stream )
      return true
    },
    async streamDelete( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.id, 'stream:owner' )

      await deleteStream( args.id )
      return true
    },
    async streamClone( parent, args, context, info ) {
      throw new ApolloError( 'Not implemented yet :)' )
    },
    async streamGrantPermission( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:owner' )
      if ( context.userId === args.userId ) throw new AuthorizationError( 'You cannot set roles for yourself.' )
      return await grantPermissionsStream( args.streamId, args.userId, args.role.toLowerCase( ) || 'read' )
    },
    async streamRevokePermission( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:owner' )

      return await revokePermissionsStream( args.streamId, args.userId )
    }
  }
}