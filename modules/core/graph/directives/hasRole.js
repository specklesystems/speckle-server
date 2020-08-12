const { ApolloError, ForbiddenError, SchemaDirectiveVisitor } = require( 'apollo-server-express' )
const { defaultFieldResolver } = require( 'graphql' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

let roles

module.exports = {
  hasRole: class HasRoleDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition( field ) {
      const { resolver = defaultFieldResolver, name } = field
      const requiredRole = this.args.role
      console.log( requiredRole )

      field.resolve = async function ( parent, args, context, info ) {
        if ( !roles )
          roles = await knex( 'user_roles' ).select( '*' )

        if ( !context.auth ) throw new ForbiddenError( 'You must provide an auth token.' )
        if ( context.role === 'server:admin' ) {
          // pass
        } else {
          let role = roles.find( r => r.name === requiredRole )
          let myRole = roles.find( r => r.name === context.role )
          console.log( context.role )

          if ( role === null ) new ApolloError( 'Invalid server role specified' )
          if ( myRole === null ) new ForbiddenError( 'You do not have the required server role (null)' )
          if ( myRole.weight < role.weight )
            throw new ForbiddenError( 'You do not have the required server role' )
        }

        const data = await resolver.call( this, parent, args, context, info )
        return data
      }
    }
  }
}
