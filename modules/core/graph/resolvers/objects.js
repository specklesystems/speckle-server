'use strict'
const root = require( 'app-root-path' )
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
const { validateScopes, authorizeResolver } = require( `${root}/modules/shared` )
const { getUser } = require( '../../users/services' )
const { createCommit, getCommitsByStreamId, createObject, createObjects, getObject, getObjects } = require( '../../objects/services' )
const { createTag, updateTag, getTagById, deleteTagById, getTagsByStreamId, createBranch, updateBranch, getBranchById, getBranchCommits, deleteBranchById, getBranchesByStreamId, getStreamReferences } = require( '../../references/services' )

module.exports = {
  Query: {

  },
  Stream: {
    async commits( parent, args, context, info ) {
      let commits = await getCommitsByStreamId( parent.id )
      return { totalCount: commits.length, commits: commits }
    },
    async tags( parent, args, context, info ) {
      // TODO: implement limits in service
      let tags = await getTagsByStreamId( parent.id )
      return { totalCount: tags.length, tags: tags.slice( args.offset, args.offset + args.limit ) }
    },
    async tag( parent, args, context, info ) {
      return await getTagById( args.id )
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
    async author( parent, args, context, info ) {
      return await getUser( parent.author )
    }
  },
  Tag: {
    async commit( parent, args, context, info ) {
      let obj = await getObject( parent.commitId )
      return obj
    }
  },
  Branch: {
    async commits( parent, args, context, info ) {
      // console.log( parent )
      let commitIds = ( await getBranchCommits( parent.id ) ).map( o => o.commitId )
      let commits = await getObjects( commitIds )
      console.log( commits )
      return { totalCount: commits.length, commits: commits.slice( args.offset, args.offset + args.limit ) }
    }
  },
  Mutation: {
    async objectCreate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      let ids = await createObjects( args.objects )
      return ids
    },
    async commitCreate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      let id = await createCommit( args.streamId, context.userId, args.commit )
      return id
    },
    async branchCreate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      let id = await createBranch( args.branch, args.streamId, context.userId )
      return id
    },
    async branchUpdate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      await updateBranch( args.branch )
      return true
    },
    async branchDelete( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      await deleteBranchById( args.branchId )
      return true
    },
    async tagCreate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      let id = await createTag( args.tag, args.streamId, context.userId )
      return id
    },
    async tagUpdate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      await updateTag( args.tag )
      return true
    },
    async tagDelete( parent, args, context, info ) {
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.streamId, 'stream_acl', 'streams', 'write' )

      await deleteTagById( args.tagId )
      return true
    },

  },
  Reference: {
    __resolveType( reference, context, info ) {
      if ( reference.type === "branch" ) return 'Branch'
      if ( reference.type === "tag" ) return 'Tag'
    }
  },
}