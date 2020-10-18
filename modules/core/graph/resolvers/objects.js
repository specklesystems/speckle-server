'use strict'
const appRoot = require( 'app-root-path' )
const { ForbiddenError, ApolloError } = require( 'apollo-server-express' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { getUser } = require( '../../services/users' )
const {
  createObject,
  createObjects,
  getObject,
  getObjects,
  getObjectChildren,
  getObjectChildrenQuery
} = require( '../../services/objects' )

module.exports = {
  Stream: {
    async object( parent, args, context, info ) {
      let obj = await getObject( { objectId: args.id } )
      return obj
    }
  },
  Object: {
    async children( parent, args, context, info ) {
      // The simple query branch
      if ( !args.query && !args.orderBy ) {
        let result = await getObjectChildren( { objectId: parent.id, limit: args.limit, depth: args.depth, select: args.select, cursor: args.cursor } )
        return { totalCount: parent.totalChildrenCount, cursor: result.cursor, objects: result.objects }
      }

      // The complex query branch
      let result = await getObjectChildrenQuery( { objectId: parent.id, limit: args.limit, depth: args.depth, select: args.select, query: args.query, orderBy: args.orderBy, cursor: args.cursor } )
      return result
    }
  },
  Mutation: {
    async objectCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'streams:write' )
      await authorizeResolver( context.userId, args.objectInput.streamId, 'stream:contributor' )

      let ids = await createObjects( args.objectInput.objects )
      return ids
    }
  }
}
