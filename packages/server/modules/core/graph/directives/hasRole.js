const { SchemaDirectiveVisitor } = require('apollo-server-express')
const { defaultFieldResolver } = require('graphql')
const { validateServerRole } = require('@/modules/shared')

module.exports = {
  hasRole: class HasRoleDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const { resolver = field.resolve || defaultFieldResolver } = field
      const requiredRole = this.args.role

      field.resolve = async function (parent, args, context, info) {
        await validateServerRole(context, requiredRole)

        const data = await resolver.call(this, parent, args, context, info)
        return data
      }
    }
  }
}
