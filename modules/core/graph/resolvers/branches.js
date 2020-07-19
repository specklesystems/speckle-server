'use strict'

const appRoot = require( 'app-root-path' )
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
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
  Query: {},
  Stream: {
    async branches( parent, args, context, info ) {
      throw new ApolloError('not implemented')
    },
    async branch( parent, args, context, info ) {
      throw new ApolloError('not implemented')
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
      await authorizeResolver( context.userId, args.streamId, 'stream:contributor' )

      let id = await createBranch( args.branch, args.streamId, context.userId )
      return id
    },
    async branchUpdate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:contributor' )

      await updateBranch( args.branch )
      return true
    },
    async branchDelete( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:contributor' )

      await deleteBranchById( args.branchId )
      return true
    }
  }
}