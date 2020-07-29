'use strict'

const appRoot = require( 'app-root-path' )
const { ForbiddenError, ApolloError } = require( 'apollo-server-express' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const {
  createCommitByBranchName,
  createCommitByBranchId,
  updateCommit,
  deleteCommit,
  getCommitsByBranchId,
  getCommitsByBranchName,
  getCommitsTotalCountByBranchId
} = require( '../../services/commits' )

const {
  createBranch,
  updateBranch,
  getBranchById,
  getBranchesByStreamId,
  getBranchByNameAndStreamId,
  deleteBranchById
} = require( '../../services/branches' )

const { getUserById } = require( '../../services/users' )

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
      return await getUserById( { userId: parent.authorId } )
    }

  },
  Mutation: {
    async branchCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.branch.streamId, 'stream:contributor' )

      let id = await createBranch( { ...args.branch, authorId: context.userId } )
      return id
    },

    async branchUpdate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.branch.streamId, 'stream:contributor' )

      return await updateBranch( { ...args.branch } )
    },

    async branchDelete( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      let role = await authorizeResolver( context.userId, args.branch.streamId, 'stream:contributor' )

      let branch = await getBranchById( { id: args.branch.id } )
      if ( !branch ) {
        throw new ApolloError( 'Branch not found.' )
      }

      if ( branch.authorId !== context.userId && role !== 'stream:owner' )
        throw new ForbiddenError( 'Only the branch creator or stream owners are allowed to delete branches.' )

      return await deleteBranchById( { id: args.branch.id } )
    }
  }
}
