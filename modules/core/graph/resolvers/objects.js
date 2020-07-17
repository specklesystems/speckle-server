'use strict'
const appRoot = require( 'app-root-path' )
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { getUser } = require( '../../services/users' )
const { createCommit, getCommitsByStreamId, createObject, createObjects, getObject, getObjects, getObjectChildren, getObjectChildrenQuery } = require( '../../services/objects' )
const { createBranch, updateBranch, getBranchById, getBranchCommits, deleteBranchById, getBranchesByStreamId } = require( '../../services/branches' )

module.exports = {
  Query: {

  },
  Stream: {
    async commits( parent, args, context, info ) {
      let commits = await getCommitsByStreamId( parent.id )
      return { totalCount: commits.length, commits: commits }
    },
    async commit( parent, args, context, info ) {
      let commit = getObject( { objectId: args.id } )
      return commit
    },
    async branches( parent, args, context, info ) {
      // TODO: implement limits in service
      let branches = await getBranchesByStreamId( parent.id )
      return { totalCount: branches.length, branches: branches.slice( args.offset, args.offset + args.limit ) }
    },
    async branch( parent, args, context, info ) {
      return await getBranchById( args.id )
    }
  },
  Object: {
    async children( parent, args, context, info ) {
      // Simple query
      if ( !args.query && !args.orderBy ) {
        let result = await getObjectChildren( { objectId: parent.id, limit: args.limit, depth: args.depth, select: args.select, cursor: args.cursor } )
        return { totalCount: parent.totalChildrenCount, cursor: result.cursor, objects: result.objects }
      }

      // Comlex query
      let result = await getObjectChildrenQuery( { objectId: parent.id, limit: args.limit, depth: args.depth, select: args.select, query: args.query, orderBy: args.orderBy, cursor: args.cursor } )
      return result
    }
  },
  Branch: {
    async commits( parent, args, context, info ) {
      let commitIds = ( await getBranchCommits( parent.id ) ).map( o => o.commitId )
      let commits = await getObjects( commitIds )
      return { totalCount: commits.length, commits: commits.slice( args.offset, args.offset + args.limit ) }
    }
  },
  Mutation: {
    async objectCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:contributor' )

      let ids = await createObjects( args.objects )
      return ids
    },
    async commitCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream:contributor' )

      let id = await createCommit( args.streamId, context.userId, args.commit )
      return id
    },
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