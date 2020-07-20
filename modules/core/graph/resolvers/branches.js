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
  getCommitsByBranchName
} = require( '../../services/commits' )

const {
  createBranch,
  updateBranch,
  getBranchById,
  getBranchesByStreamId,
  deleteBranchById
} = require( '../../services/branches' )

module.exports = {
  Query: { },
  Stream: {
    async branches( parent, args, context, info ) {
      throw new ApolloError( 'not implemented' )
    },
    async branch( parent, args, context, info) {
      throw new ApolloError( 'not implemented' )
    },
  },
  Branch: {
    async author( parent, args, context, info ) {
      throw new ApolloError( 'not implemented' )
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
