'use strict'
const { ApolloError, ForbiddenError, UserInputError, withFilter } = require( 'apollo-server-express' )
const appRoot = require( 'app-root-path' )

const {
  createStream,
  getStream,
  getStreams,
  updateStream,
  deleteStream,
  getUserStreams,
  getUserStreamsCount,
  getStreamUsers,
  grantPermissionsStream,
  revokePermissionsStream,
} = require( '../../services/streams' )

const { authorizeResolver, validateScopes, validateServerRole, pubsub } = require( `${appRoot}/modules/shared` )
const { saveActivity } = require( `${appRoot}/modules/activitystream/services` )

// subscription events
const USER_STREAM_ADDED = 'USER_STREAM_ADDED'
const USER_STREAM_REMOVED = 'USER_STREAM_REMOVED'
const STREAM_UPDATED = 'STREAM_UPDATED'
const STREAM_DELETED = 'STREAM_DELETED'

function sleep( ms ) {
  return new Promise( ( resolve ) => {
    setTimeout( resolve, ms )
  } )
}

const _deleteStream = async ( parent, args, context, info ) => {
  await saveActivity( {
    streamId: args.id,
    resourceType: 'stream',
    resourceId: args.id,
    actionType: 'stream_delete',
    userId: context.userId,
    info: { },
    message: 'Stream deleted'
  } )

  // Notify any listeners on the streamId
  await pubsub.publish( STREAM_DELETED, { streamDeleted: { streamId: args.id }, streamId: args.id } )

  // Notify all stream users
  let users = await getStreamUsers( { streamId: args.id } )

  for ( let user of users ) {
    await pubsub.publish( USER_STREAM_REMOVED, { userStreamRemoved: { id: args.id }, ownerId: user.id } )
  }

  // delay deletion by a bit so we can do auth checks
  await sleep( 250 )

  // Delete after event so we can do authz
  await deleteStream( { streamId: args.id } )
  return true
}

module.exports = {
  Query: {

    async stream( parent, args, context, info ) {
      let stream = await getStream( { streamId: args.id, userId: context.userId } )
      if ( !stream )
        throw new ApolloError( 'Stream not found' )

      if ( !stream.isPublic && context.auth === false )
        throw new ForbiddenError( 'You are not authorized.' )

      if ( !stream.isPublic ) {
        await validateServerRole( context, 'server:user' )
        await validateScopes( context.scopes, 'streams:read' )
        await authorizeResolver( context.userId, args.id, 'stream:reviewer' )
      }

      return stream
    },

    async streams( parent, args, context, info ) {
      if ( args.limit && args.limit > 50 )
        throw new UserInputError( 'Cannot return more than 50 items at a time.' )

      let totalCount = await getUserStreamsCount( { userId: context.userId, publicOnly: false, searchQuery: args.query } )

      let { cursor, streams } = await getUserStreams( { userId: context.userId, limit: args.limit, cursor: args.cursor, publicOnly: false, searchQuery: args.query } )
      return { totalCount, cursor: cursor, items: streams }
    },

    async adminStreams( parent, args, context, info ) {
      if ( args.limit && args.limit > 50 )
        throw new UserInputError( 'Cannot return more than 50 items at a time.' )

      let { streams, totalCount } = await getStreams( 
        { offset: args.offset, limit: args.limit, orderBy: args.orderBy, publicOnly: args.publicOnly, searchQuery: args.query, visibility: args.visibility } )
      return { totalCount, items: streams }
    }

  },

  Stream: {

    async collaborators( parent, args, context, info ) {
      let users = await getStreamUsers( { streamId: parent.id } )
      return users
    },

    // async size ( parent, args, context, info ) {
    //   let size = await streamSize( { streamId: parent.id } )
    //   return size
    // }
  },

  User: {

    async streams( parent, args, context, info ) {
      if ( args.limit && args.limit > 50 )
        throw new UserInputError( 'Cannot return more than 50 items.' )
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

      await saveActivity( {
        streamId: id,
        resourceType: 'stream',
        resourceId: id,
        actionType: 'stream_create',
        userId: context.userId,
        info: { stream: args.stream },
        message: `Stream '${args.stream.name}' created`
      } )
      await pubsub.publish( USER_STREAM_ADDED, { userStreamAdded: { id: id, ...args.stream }, ownerId: context.userId } )
      return id
    },

    async streamUpdate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.stream.id, 'stream:owner' )

      let oldValue = await getStream( { streamId: args.stream.id } )
      let update = { streamId: args.stream.id, name: args.stream.name, description: args.stream.description, isPublic: args.stream.isPublic }

      await updateStream( update )

      await saveActivity( {
        streamId: args.stream.id,
        resourceType: 'stream',
        resourceId: args.stream.id,
        actionType: 'stream_update',
        userId: context.userId,
        info: { old: oldValue, new: args.stream },
        message: 'Stream metadata changed'
      } )
      await pubsub.publish( STREAM_UPDATED, { streamUpdated: { id: args.stream.id, name: args.stream.name, description: args.stream.description }, id: args.stream.id } )

      return true
    },

    async streamDelete( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.id, 'stream:owner' )
      return await _deleteStream( parent, args, context, info )
    },

    async streamsDelete( parent, args, context, info ) {
      const results = await Promise.all( args.ids.map( async id => {
        let newArgs = { ...args }
        newArgs.id = id
        return await _deleteStream( parent, newArgs, context, info )
      } ) )
      return results.every( res => res === true )
    },

    async streamGrantPermission( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.permissionParams.streamId, 'stream:owner' )

      if ( context.userId === args.permissionParams.userId ) throw new Error( 'You cannot set roles for yourself.' )

      let params = { streamId: args.permissionParams.streamId, userId: args.permissionParams.userId, role: args.permissionParams.role.toLowerCase( ) || 'read' }
      let granted = await grantPermissionsStream( params )

      if ( granted ) {
        await saveActivity( {
          streamId: params.streamId,
          resourceType: 'stream',
          resourceId: params.streamId,
          actionType: 'stream_permissions_add',
          userId: context.userId,
          info: { targetUser: params.userId, role: params.role },
          message: `Permission granted to user ${params.userId} (${params.role})`
        } )
        await pubsub.publish( USER_STREAM_ADDED, { userStreamAdded: { id: args.permissionParams.streamId, sharedBy: context.userId }, ownerId: args.permissionParams.userId } )
      }

      return granted
    },

    async streamRevokePermission( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.permissionParams.streamId, 'stream:owner' )

      if ( context.userId === args.permissionParams.userId )
        throw new ApolloError( 'You cannot revoke your own access rights to a stream.' )

      let revoked = await revokePermissionsStream( { ...args.permissionParams } )

      if ( revoked ) {
        await saveActivity( {
          streamId: args.permissionParams.streamId,
          resourceType: 'stream',
          resourceId: args.permissionParams.streamId,
          actionType: 'stream_permissions_remove',
          userId: context.userId,
          info: { targetUser: args.permissionParams.userId },
          message: `Permission revoked for user ${args.permissionParams.userId}`
        } )
        await pubsub.publish( USER_STREAM_REMOVED, { userStreamRemoved: { id: args.permissionParams.streamId, revokedBy: context.userId }, ownerId: args.permissionParams.userId } )
      }

      return revoked
    }

  },

  Subscription: {

    userStreamAdded: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ USER_STREAM_ADDED ] ),
        ( payload, variables, context ) => {
          return payload.ownerId === context.userId
        } )
    },

    userStreamRemoved: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ USER_STREAM_REMOVED ] ),
        ( payload, variables, context ) => {
          return payload.ownerId === context.userId
        } )
    },

    streamUpdated: {
      subscribe: withFilter(
        ( ) => pubsub.asyncIterator( [ STREAM_UPDATED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.id, 'stream:reviewer' )
          return payload.id === variables.streamId
        } )
    },

    streamDeleted: {
      subscribe: withFilter( ( ) => pubsub.asyncIterator( [ STREAM_DELETED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
          return payload.streamId === variables.streamId
        } )
    },
  }
}
