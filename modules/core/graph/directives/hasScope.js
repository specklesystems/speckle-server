const { ForbiddenError, SchemaDirectiveVisitor } = require( 'apollo-server-express' )
const { defaultFieldResolver } = require( 'graphql' )
const appRoot = require( 'app-root-path' )
const { validateScopes } = require( `${appRoot}/modules/shared` )

module.exports = {
  hasScope: class HasScopeDirective extends SchemaDirectiveVisitor {
    visitObject( type ) {
      this.wrapFields( type )
    }

    visitFieldDefinition( field, details ) {
      this.wrapFields( details.objectType )
    }

    wrapFields( objectType ) {
      // Mark the GraphQLObjectType object to avoid re-wrapping
      if ( objectType._authScopeFieldsWrapped ) return
      objectType._authScopeFieldsWrapped = true

      const fields = objectType.getFields()

      Object.keys( fields ).forEach( fieldName => {
        const field = fields[ fieldName ];
        const { resolver = field.resolve || defaultFieldResolver, name } = field
        const requiredScope = this.args.scope

        field.resolve = async function ( parent, args, context, info ) {
          const currentScopes = context.scopes
          await validateScopes( currentScopes, requiredScope )

          const data = await resolver.call( this, parent, args, context, info )
          return data
        }
      } )
    }
  }
}

