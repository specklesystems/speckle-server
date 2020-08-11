'use strict'
const { AuthorizationError, ApolloError, withFilter } = require( 'apollo-server-express' )
const appRoot = require( 'app-root-path' )

const {
  createStream,
  getStream,
  updateStream,
  deleteStream,
  getUserStreams,
  getUserStreamsCount,
  getStreamUsers,
  grantPermissionsStream,
  revokePermissionsStream
} = require( '../../services/streams' )

const { validateServerRole, validateScopes, authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )

const STREAM_CREATED = 'STREAM_CREATED'

module.exports = {
  Query: {
    async stream( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:read' )
      await authorizeResolver( context.userId, args.id, 'stream:reviewer' )

      let stream = await getStream( { streamId: args.id } )
      return stream
    },
    async streams( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:read' )

      if ( args.limit && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items, please use pagination.' )

      let totalCount = await getUserStreamsCount( { userId: context.userId, publicOnly: false, searchQuery: args.query } )

      let { cursor, streams } = await getUserStreams( { userId: context.userId, limit: args.limit, cursor: args.cursor, publicOnly: false, searchQuery: args.query } )
      return { totalCount, cursor: cursor, items: streams }
    }
  },
  Stream: {

    async collaborators( parent, args, context, info ) {
      let users = await getStreamUsers( { streamId: parent.id } )
      return users
    }

  },
  User: {

    async streams( parent, args, context, info ) {
      if ( args.limit && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items, please use pagination.' )
        // Return only the user's public streams if parent.id !== context.userId
      let publicOnly = parent.id !== context.userId
      let totalCount = await getUserStreamsCount( { userId: parent.id, publicOnly } )

      let { cursor, streams } = await getUserStreams( { userId: parent.id, limit: args.limit, cursor: args.cursor, publicOnly: publicOnly } )
      return { totalCount, cursor: cursor, items: streams }
    }

  },
  Mutation: {
    async streamCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )

      let id = await createStream( { ...args.stream, ownerId: context.userId } )
      await pubsub.publish( STREAM_CREATED, { streamCreated: { id: id, ...args.stream }, ownerId: context.userId } )
      return id
    },

    async streamUpdate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.stream.id, 'stream:owner' )

      await updateStream( { streamId: args.stream.id, name: args.stream.name, description: args.stream.description } )
      return true
    },

    async streamDelete( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.id, 'stream:owner' )

      await deleteStream( { streamId: args.id } )
      return true
    },

    async streamGrantPermission( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:owner' )

      if ( context.userId === args.userId ) throw new Error( 'You cannot set roles for yourself.' )

      return await grantPermissionsStream( { streamId: args.streamId, userId: args.userId, role: args.role.toLowerCase( ) || 'read' } )
    },

    async streamRevokePermission( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:owner' )

      return await revokePermissionsStream( { ...args } )
    }
  },
  Subscription: {
    streamCreated: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ STREAM_CREATED ] ),
        ( payload, variables ) => {
          return payload.ownerId === variables.ownerId
        } )
    }
  }
}
