'use strict'
const root = require( 'app-root-path' )
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
const { validateScopes, authorizeResolver } = require( `${root}/modules/shared` )
const { createCommit, createObject, createObjects, getObject, getObjects } = require( '../../objects/services' )

module.exports = {
  Query: {

  },
  Stream: {

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
    }
  },
  Reference: {
    __resolveType( reference, context, info ) {
      if ( reference.type === "branch" ) return 'Branch'
      if ( reference.type === "tag" ) return 'Tag'
    }
  },
}