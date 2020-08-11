const { ForbiddenError, SchemaDirectiveVisitor } = require( 'apollo-server-express' )
const { defaultFieldResolver } = require( 'graphql' )

class HasScopeDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition( field ) {
    // const originalResolver = field.resolve || defaultFieldResolver
    const { resolver = defaultFieldResolver, name } = field
    const requiredScope = this.args.scope

    field.resolve = async function ( parent, args, context, info ) {
      const currentScopes = context.scopes // doesn't get anything rn bc needs to be hooked up in contextApiTokenHelper
      const ownerId = parent.ownerId
      // taken from validateScopes
      if ( !currentScopes )
        throw new ForbiddenError( `sorry, you need scope '${requiredScope}' but you don't have any scopes.` )
      if ( currentScopes.indexOf( requiredScope ) === -1 && currentScopes.indexOf( '*' ) === -1 )
        throw new ForbiddenError( `sorry, you need scope '${requiredScope}' but you have '${currentScopes}'` )

      const data = await await resolver.call( this, parent, args, context, info )

      return data
    }
  }
}

module.exports = {
  HasScopeDirective
}
