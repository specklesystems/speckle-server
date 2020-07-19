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
  getCommitsByBranchName,
  getCommitsByUserId,
  getCommitsTotalCountByUserId
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
    async commit( parent, args, context, info ) {
      throw new ApolloError( 'not implemented' )
    }
  },
  User: {
    async commits( parent, args, context, info ) {
      // TODO
      throw new ApolloError( 'not implemented' )
    }
  },
  Branch: {
    async commits( parent, args, context, info ) {
      throw new ApolloError( 'not implemented' )
    }
  },
  Mutation: {
    async commitCreate( parent, args, context, info ) {
      throw new ApolloError('not implemented')

    },
    async commitUpdate( parent, args, context, info ) {
      throw new ApolloError('not implemented')

    },
    async commitDelete( parent, args, context, info ) {
      throw new ApolloError('not implemented')
      
    }
  }
}