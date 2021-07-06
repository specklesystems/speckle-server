const { ForbiddenError, SchemaDirectiveVisitor } = require( 'apollo-server-express' )
const { defaultFieldResolver } = require( 'graphql' )
const appRoot = require( 'app-root-path' )
const { validateScopes } = require( `${appRoot}/modules/shared` )

module.exports = {
  hasScope: class HasScopeDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition( field, details ) {
      const { resolver = field.resolve || defaultFieldResolver, name } = field
      const requiredScope = this.args.scope

      field.resolve = async function ( parent, args, context, info ) {
        const currentScopes = context.scopes
        await validateScopes( currentScopes, requiredScope )

        const data = await resolver.call( this, parent, args, context, info )
        return data
      }
    }
  },
  hasScopes: class HasScopeDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition( field, details ) {
      const { resolver = field.resolve || defaultFieldResolver, name } = field
      const requiredScopes = this.args.scopes

      field.resolve = async function ( parent, args, context, info ) {
        const currentScopes = context.scopes
        requiredScopes.forEach( async ( requiredScope ) => {
          await validateScopes( currentScopes, requiredScope )
        } )

        const data = await resolver.call( this, parent, args, context, info )
        return data
      }
    }
  }
}

