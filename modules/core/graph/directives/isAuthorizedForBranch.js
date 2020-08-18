const { ApolloError, ForbiddenError, SchemaDirectiveVisitor } = require( 'apollo-server-express' )
const { defaultFieldResolver } = require( 'graphql' )
const appRoot = require( 'app-root-path' )
const { authorizeResolver } = require( `${appRoot}/modules/shared` )

module.exports = {
  isAuthorizedForBranch: class IsAuthorizedForBranchDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition( field ) {
      const { resolver = field.resolve || defaultFieldResolver, name } = field
      const requiredRole = this.args.role
      let resourceId

      field.resolve = async function ( parent, args, context, info ) {
        if ( !context.auth ) throw new ForbiddenError( `You need to provide an auth token for path: '${name}'` )

        if ( info.parentType == 'Subscription' ) {
          resourceId = ( parent[ name ].streamId || parent[ name ].id )
        } else {
          resourceId = args.branch.streamId
        }

        if ( !resourceId ) throw new ApolloError( 'Could not find the resource id' )

        await authorizeResolver( context.userId, resourceId, requiredRole )

        const data = await resolver.call( this, parent, args, context, info )
        return data
      }
    }
  }
}
