'use strict'
const root = require( 'app-root-path' )
const { createStream, getStream, updateStream, deleteStream, getUserStreams, getStreamUsers, grantPermissionsStream, revokePermissionsStream } = require( '../../streams/services' )
const { validateScopes, authorizeResolver } = require( `${root}/modules/shared` )

module.exports = {
  Query: {
    async stream( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:read' )
      await authorizeResolver( context.userId, args.id, 'stream_acl', 'streams', 'read' )

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
      let streams = await getUserStreams( parent.id )
      // TODO: Implement offsets in service
      return { totalCount: streams.length, streams: streams.slice( args.offset, args.offset + args.limit ) } 
    }
  },
  Mutation: {
    async streamCreate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )

      let id = await createStream( args.stream, context.userId )
      return id
    },
    async streamUpdate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.id, 'stream_acl', 'streams', 'owner' )


    }
  }
}