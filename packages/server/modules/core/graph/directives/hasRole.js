const { SchemaDirectiveVisitor } = require('apollo-server-express')
const { defaultFieldResolver } = require('graphql')
const { validateServerRole, authorizeResolver } = require('@/modules/shared')
const { ForbiddenError } = require('@/modules/shared/errors')
const { Roles } = require('@/modules/core/helpers/mainConstants')

function mapStreamRoleToValue(graphqlStreamRole) {
  switch (graphqlStreamRole) {
    case 'STREAM_REVIEWER':
      return Roles.Stream.Reviewer
    case 'STREAM_CONTRIBUTOR':
      return Roles.Stream.Contributor
    case 'STREAM_OWNER':
    default:
      return Roles.Stream.Owner
  }
}

module.exports = {
  /**
   * Ensure that the user has the specified SERVER role (e.g. server user, admin etc.)
   */
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
  },
  /**
   * Ensure that the user has the specified STREAM role for a target stream (e.g. owner)
   *
   * Note: Only supported on Stream type fields!
   */
  hasStreamRole: class HasStreamRoleDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const { resolver = field.resolve || defaultFieldResolver } = field
      const requiredRole = mapStreamRoleToValue(this.args.role)

      field.resolve = async function (parent, args, context, info) {
        // Validate stream role only if parent is a Stream type
        if (info.parentType?.name === 'Stream' && parent) {
          if (!parent.id) {
            // This should never happen as long as our resolvers always return streams with their IDs
            throw new ForbiddenError('Unexpected access of unidentifiable stream')
          }

          if (!context.userId) {
            throw new ForbiddenError('User must be authenticated to access this data')
          }

          await authorizeResolver(context.userId, parent.id, requiredRole)
        }

        const data = await resolver.call(this, parent, args, context, info)
        return data
      }
    }
  }
}
