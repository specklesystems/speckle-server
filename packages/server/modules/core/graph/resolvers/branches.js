'use strict'

const appRoot = require( 'app-root-path' )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )

const {
  createBranch,
  updateBranch,
  getBranchById,
  getBranchesByStreamId,
  getBranchByNameAndStreamId,
  deleteBranchById
} = require( '../../services/branches' )

const { getUserById } = require( '../../services/users' )

// subscription events
const BRANCH_CREATED = 'BRANCH_CREATED'
const BRANCH_UPDATED = 'BRANCH_UPDATED'
const BRANCH_DELETED = 'BRANCH_DELETED'

module.exports = {
  Query: {},
  Stream: {

    async branches( parent, args, context, info ) {
      if ( args.limit && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items, please use pagination.' )
      let { items, cursor, totalCount } = await getBranchesByStreamId( { streamId: parent.id, limit: args.limit, cursor: args.cursor } )

      return { totalCount, cursor, items }
    },

    async branch( parent, args, context, info ) {
      return await getBranchByNameAndStreamId( { streamId: parent.id, name: args.name } )
    },

  },
  Branch: {

    async author( parent, args, context, info ) {
      if ( parent.userId )
        return await getUserById( { userId: parent.authorId } )
      else return null
    }

  },
  Mutation: {

    async branchCreate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.branch.streamId, 'stream:contributor' )

      let id = await createBranch( { ...args.branch, authorId: context.userId } )

      if ( id ) {
        await pubsub.publish( BRANCH_CREATED, {
          branchCreated: { ...args.branch, id: id, authorId: context.userId },
          streamId: args.branch.streamId
        } )
      }

      return id
    },

    async branchUpdate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.branch.streamId, 'stream:contributor' )

      let updated = await updateBranch( { ...args.branch } )

      if ( updated ) {
        await pubsub.publish( BRANCH_UPDATED, {
          branchUpdated: { ...args.branch },
          streamId: args.branch.streamId,
          branchId: args.branch.id
        } )
      }

      return updated
    },

    async branchDelete( parent, args, context, info ) {
      let role = await authorizeResolver( context.userId, args.branch.streamId, 'stream:contributor' )

      let branch = await getBranchById( { id: args.branch.id } )
      if ( !branch ) {
        throw new ApolloError( 'Branch not found.' )
      }

      if ( branch.authorId !== context.userId && role !== 'stream:owner' )
        throw new ForbiddenError( 'Only the branch creator or stream owners are allowed to delete branches.' )

      let deleted = await deleteBranchById( { id: args.branch.id, streamId: args.branch.streamId } )
      if ( deleted ) {
        await pubsub.publish( BRANCH_DELETED, { branchDeleted: { ...args.branch }, streamId: args.branch.streamId } )
      }

      return deleted
    }

  },
  Subscription: {

    branchCreated: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ BRANCH_CREATED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )

          return payload.streamId === variables.streamId
        } )
    },

    branchUpdated: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ BRANCH_UPDATED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )

          let streamMatch = payload.streamId === variables.streamId
          if ( streamMatch && variables.branchId ) {
            return payload.branchId === variables.branchId
          }

          return streamMatch
        } )
    },

    branchDeleted: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ BRANCH_DELETED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )

          return payload.streamId === variables.streamId
        } )
    }

  }
}
