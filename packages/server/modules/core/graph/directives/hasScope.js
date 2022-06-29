const { SchemaDirectiveVisitor } = require('apollo-server-express')
const { defaultFieldResolver } = require('graphql')
const { validateScopes } = require('@/modules/shared')

module.exports = {
  /**
   * Ensure that the user's access token has the specified scope allowed for it
   */
  hasScope: class HasScopeDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const { resolver = field.resolve || defaultFieldResolver } = field
      const requiredScope = this.args.scope

      field.resolve = async function (parent, args, context, info) {
        const currentScopes = context.scopes
        await validateScopes(currentScopes, requiredScope)

        const data = await resolver.call(this, parent, args, context, info)
        return data
      }
    }
  },
  /**
   * Ensure that the user's access token has the specified scopes allowed for it
   */
  hasScopes: class HasScopeDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const { resolver = field.resolve || defaultFieldResolver } = field
      const requiredScopes = this.args.scopes

      field.resolve = async function (parent, args, context, info) {
        const currentScopes = context.scopes
        requiredScopes.forEach(async (requiredScope) => {
          await validateScopes(currentScopes, requiredScope)
        })

        const data = await resolver.call(this, parent, args, context, info)
        return data
      }
    }
  }
}
