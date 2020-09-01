'use strict'
const { UserInputError, withFilter } = require( 'apollo-server-express' )
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

const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )

// subscription events
const USER_STREAM_CREATED = 'USER_STREAM_CREATED'
const USER_STREAM_DELETED = 'USER_STREAM_DELETED'
const STREAM_UPDATED = 'STREAM_UPDATED'
const STREAM_DELETED = 'STREAM_DELETED'
const STREAM_PERMISSION_GRANTED = 'STREAM_PERMISSION_GRANTED'
const STREAM_PERMISSION_REVOKED = 'STREAM_PERMISSION_REVOKED'

function sleep( ms ) {
  return new Promise( ( resolve ) => {
    setTimeout( resolve, ms )
  } )
}

module.exports = {
  Query: {

    async stream( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.id, 'stream:reviewer' )

      let stream = await getStream( { streamId: args.id } )
      return stream
    },

    async streams( parent, args, context, info ) {
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
      let id = await createStream( { ...args.stream, ownerId: context.userId } )
      await pubsub.publish( USER_STREAM_CREATED, { userStreamCreated: { id: id, ...args.stream }, ownerId: context.userId } )
      return id
    },

    async streamUpdate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.stream.id, 'stream:owner' )

      let update = { streamId: args.stream.id, name: args.stream.name, description: args.stream.description }

      await updateStream( update )

      await pubsub.publish( STREAM_UPDATED, { streamUpdated: update, streamId: args.stream.id } )

      return true
    },

    async streamDelete( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.id, 'stream:owner' )

      // Notify any listeners on the streamId
      await pubsub.publish( STREAM_DELETED, { streamDeleted: { streamId: args.id }, streamId: args.id } )

      // Notify all stream users
      let users = await getStreamUsers( { streamId: args.id } )

      for ( let user of users ) {
        await pubsub.publish( USER_STREAM_DELETED, { userStreamDeleted: { streamId: args.id }, ownerId: user.id } )
      }

      // delay deletion by a bit so we can do auth checks
      await sleep( 250 )

      // Delete after event so we can do authz
      await deleteStream( { streamId: args.id } )
      return true
    },

    async streamGrantPermission( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.permissionParams.streamId, 'stream:owner' )

      if ( context.userId === args.permissionParams.userId ) throw new Error( 'You cannot set roles for yourself.' )

      let params = { streamId: args.permissionParams.streamId, userId: args.permissionParams.userId, role: args.permissionParams.role.toLowerCase( ) || 'read' }
      let granted = await grantPermissionsStream( params )

      if ( granted ) {
        await pubsub.publish( STREAM_PERMISSION_GRANTED, {
          streamPermissionGranted: { ...params, grantor: context.userId },
          userId: params.userId,
          streamId: params.streamId
        } )
      }

      return granted
    },

    async streamRevokePermission( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.permissionParams.streamId, 'stream:owner' )
      let revoked = await revokePermissionsStream( { ...args.permissionParams } )

      if ( revoked ) {
        await pubsub.publish( STREAM_PERMISSION_REVOKED, {
          streamPermissionRevoked: { ...args.permissionParams },
          userId: args.permissionParams.userId,
          streamId: args.permissionParams.streamId
        } )
      }

      return revoked
    }

  },
  Subscription: {

    userStreamCreated: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ USER_STREAM_CREATED ] ),
        ( payload, variables, context ) => {
          return payload.ownerId === context.userId
        } )
    },

    userStreamDeleted: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ USER_STREAM_DELETED ] ),
        ( payload, variables, context ) => {
          return payload.ownerId === context.userId
        } )
    },

    streamUpdated: {
      subscribe: withFilter(
        ( ) => pubsub.asyncIterator( [ STREAM_UPDATED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
          return payload.streamId === variables.streamId
        } )
    },

    streamDeleted: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ STREAM_DELETED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
          return payload.streamId === variables.streamId
        } )
    },

    streamPermissionGranted: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ STREAM_PERMISSION_GRANTED ] ),
        ( payload, variables ) => {
          return payload.userId === variables.userId
        } )
    },

    streamPermissionRevoked: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ STREAM_PERMISSION_REVOKED ] ),
        ( payload, variables ) => {
          return payload.userId === variables.userId
        } )
    }
  }
}
