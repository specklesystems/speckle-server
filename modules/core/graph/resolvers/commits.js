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
  Stream: {},
  Branch: {},
  Mutation: {
    async commitCreate( parent, args, context, info ) {},
    async commitUpdate( parent, args, context, info ) {},
    async commitDelete( parent, args, context, info ) {}
  }
}