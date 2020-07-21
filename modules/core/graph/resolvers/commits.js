'use strict'

const appRoot = require( 'app-root-path' )
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const {
  createCommitByBranchName,
  createCommitByBranchId,
  updateCommit,
  deleteCommit,
  getCommitById,
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

      let publicOnly = context.userId !== parent.id
      let totalCount = await getCommitsTotalCountByUserId( { userId: parent.id } )
      let { commits: items, cursor } = await getCommitsByUserId( { userId: parent.id, limit: args.limit, cursor: args.cursor, publicOnly } )

      return { items, cursor, totalCount }
    }

  },
  Branch: {

    async commits( parent, args, context, info ) {

      throw new ApolloError( 'not implemented' )

    }

  },
  Mutation: {

    async commitCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.commit.streamId, 'stream:contributor' )

      return await createCommitByBranchName( { ...args.commit, authorId: context.userId } )
    },

    async commitUpdate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.commit.streamId, 'stream:contributor' )

      let commit = await getCommitById( { id: args.commit.id } )
      if ( commit.author !== context.userId )
        throw new AuthorizationError( 'Only the author of a commit may update it.' )

      return await updateCommit( { ...args.commit } )
    },

    async commitDelete( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.commit.streamId, 'stream:contributor' )

      let commit = await getCommitById( { id: args.commit.id } )
      if ( commit.author !== context.userId )
        throw new AuthorizationError( 'Only the author of a commit may delete it.' )

      return await deleteCommit( { id: args.commit.id } )
    }
  }
}
