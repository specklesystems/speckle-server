'use strict'

const appRoot = require( 'app-root-path' )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )
const { saveActivity } = require( `${appRoot}/modules/activitystream/services` )

const {
  createCommitByBranchName,
  createCommitByBranchId,
  updateCommit,
  deleteCommit,
  getCommitById,
  getCommitsByBranchId,
  getCommitsByBranchName,
  getCommitsByUserId,
  getCommitsByStreamId,
  getCommitsTotalCountByStreamId,
  getCommitsTotalCountByUserId,
  getCommitsTotalCountByBranchId
} = require( '../../services/commits' )

// subscription events
const COMMIT_CREATED = 'COMMIT_CREATED'
const COMMIT_UPDATED = 'COMMIT_UPDATED'
const COMMIT_DELETED = 'COMMIT_DELETED'

module.exports = {
  Query: {},
  Stream: {

    async commits( parent, args, context, info ) {
      if ( args.limit && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items, please use pagination.' )
      let { commits: items, cursor } = await getCommitsByStreamId( { streamId: parent.id, limit: args.limit, cursor: args.cursor } )
      let totalCount = await getCommitsTotalCountByStreamId( { streamId: parent.id } )

      return { items, cursor, totalCount }
    },

    async commit( parent, args, context, info ) {
      if ( !args.id ) {
        let { commits } = await getCommitsByStreamId( { streamId: parent.id, limit: 1 } )
        if ( commits.length !== 0 ) return commits[0]
        throw new ApolloError( 'Cannot retrieve commit (there are no commits in this stream).' )
      }
      let c = await getCommitById( { id: args.id } )
      return c
    }

  },
  User: {
    async commits( parent, args, context, info ) {
      let publicOnly = context.userId !== parent.id
      let totalCount = await getCommitsTotalCountByUserId( { userId: parent.id } )
      if ( args.limit && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items, please use pagination.' )
      let { commits: items, cursor } = await getCommitsByUserId( { userId: parent.id, limit: args.limit, cursor: args.cursor, publicOnly } )

      return { items, cursor, totalCount }
    }

  },
  Branch: {

    async commits( parent, args, context, info ) {
      if ( args.limit && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items, please use pagination.' )
      let { commits, cursor } = await getCommitsByBranchId( { branchId: parent.id, limit: args.limit, cursor: args.cursor } )
      let totalCount = await getCommitsTotalCountByBranchId( { branchId: parent.id } )

      return { items: commits, totalCount, cursor }
    }

  },
  Mutation: {

    async commitCreate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.commit.streamId, 'stream:contributor' )

      let id = await createCommitByBranchName( { ...args.commit, authorId: context.userId } )
      if ( id ) {
        await saveActivity( {
          streamId: args.commit.streamId,
          resourceType: 'commit',
          resourceId: id,
          actionType: 'commit_create',
          userId: context.userId,
          info: { id: id, commit: args.commit },
          message: `Commit created on branch ${args.commit.branchName}: ${id} (${args.commit.message})`
        } )
        await pubsub.publish( COMMIT_CREATED, {
          commitCreated: { ...args.commit, id: id, authorId: context.userId },
          streamId: args.commit.streamId
        } )
      }

      return id
    },

    async commitUpdate( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.commit.streamId, 'stream:contributor' )

      let commit = await getCommitById( { id: args.commit.id } )
      if ( commit.authorId !== context.userId )
        throw new ForbiddenError( 'Only the author of a commit may update it.' )

      let updated = await updateCommit( { ...args.commit } )
      if ( updated ) {
        await saveActivity( {
          streamId: args.commit.streamId,
          resourceType: 'commit',
          resourceId: args.commit.id,
          actionType: 'commit_update',
          userId: context.userId,
          info: { old: commit, new: args.commit },
          message: `Commit message changed: ${args.commit.id} (${args.commit.message})`
        } )
        await pubsub.publish( COMMIT_UPDATED, {
          commitUpdated: { ...args.commit },
          streamId: args.commit.streamId,
          commitId: args.commit.id
        } )
      }

      return updated
    },

    async commitDelete( parent, args, context, info ) {
      await authorizeResolver( context.userId, args.commit.streamId, 'stream:contributor' )

      let commit = await getCommitById( { id: args.commit.id } )
      if ( commit.authorId !== context.userId )
        throw new ForbiddenError( 'Only the author of a commit may delete it.' )

      let deleted = await deleteCommit( { id: args.commit.id } )
      if ( deleted ) {
        await saveActivity( {
          streamId: args.commit.streamId,
          resourceType: 'commit',
          resourceId: args.commit.id,
          actionType: 'commit_delete',
          userId: context.userId,
          info: { commit: commit },
          message: `Commit deleted: ${args.commit.id}`
        } )
        await pubsub.publish( COMMIT_DELETED, { commitDeleted: { ...args.commit }, streamId: args.commit.streamId } )
      }

      return deleted
    }
  },
  Subscription: {

    commitCreated: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ COMMIT_CREATED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
          return payload.streamId === variables.streamId
        } )
    },

    commitUpdated: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ COMMIT_UPDATED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )

          let streamMatch = payload.streamId === variables.streamId
          if ( streamMatch && variables.commitId ) {
            return payload.commitId === variables.commitId
          }

          return streamMatch
        } )
    },

    commitDeleted: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ COMMIT_DELETED ] ),
        async ( payload, variables, context ) => {
          await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )

          return payload.streamId === variables.streamId
        } )
    }

  }
}
