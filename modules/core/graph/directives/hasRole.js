const { SchemaDirectiveVisitor } = require( 'apollo-server-express' )
const { defaultFieldResolver } = require( 'graphql' )
const appRoot = require( 'app-root-path' )
const { validateServerRole } = require( `${appRoot}/modules/shared` )


module.exports = {
  hasRole: class HasRoleDirective extends SchemaDirectiveVisitor {
    visitObject( type ) {
      this.wrapFields( type )
    }

    visitFieldDefinition( field, details ) {
      this.wrapFields( details.objectType )
    }

    wrapFields( objectType ) {
      // Mark the GraphQLObjectType object to avoid re-wrapping
      if ( objectType._authRoleFieldsWrapped ) return
      objectType._authRoleFieldsWrapped = true

      const fields = objectType.getFields()

      Object.keys( fields ).forEach( fieldName => {
        const field = fields[ fieldName ];
        const { resolver = field.resolve || defaultFieldResolver, name } = field
        const requiredRole = this.args.role

        field.resolve = async function ( parent, args, context, info ) {
          await validateServerRole( context, requiredRole )

          const data = await resolver.call( this, parent, args, context, info )
          return data
        }
      } )
    }
  }
}
