const { SchemaDirectiveVisitor, ForbiddenError } = require( 'apollo-server-express' )
const { defaultFieldResolver } = require( 'graphql' )
const appRoot = require( 'app-root-path' )
const { validateServerRole } = require( `${appRoot}/modules/shared` )


module.exports = {
  hasRole: class HasRoleDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition( field, details ) {
      const { resolver = field.resolve || defaultFieldResolver, name } = field
      const requiredRole = this.args.role

      field.resolve = async function ( parent, args, context, info ) {
        await validateServerRole( context, requiredRole )

        const data = await resolver.call( this, parent, args, context, info )
        return data
      }
    }
  }
}
