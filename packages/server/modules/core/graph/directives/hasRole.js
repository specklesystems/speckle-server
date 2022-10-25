const { defaultFieldResolver } = require('graphql')
const { validateServerRole, authorizeResolver } = require('@/modules/shared')
const { ForbiddenError } = require('@/modules/shared/errors')
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils')
const { mapStreamRoleToValue } = require('@/modules/core/helpers/graphTypes')

module.exports = {
  /**
   * Ensure that the user has the specified SERVER role (e.g. server user, admin etc.)
   * @type {import('@/modules/core/graph/helpers/directiveHelper').GraphqlDirectiveBuilder}
   */
  hasRole: () => {
    const directiveName = 'hasRole'
    return {
      typeDefs: `
        """
        Ensure that the user has the specified SERVER role (e.g. server user, admin etc.)
        """
        directive @${directiveName}(role: String!) on FIELD_DEFINITION
      `,
      schemaTransformer: (schema) =>
        mapSchema(schema, {
          [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
            const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
            if (!directive) return undefined

            const { role: requiredRole } = directive
            const { resolve = defaultFieldResolver } = fieldConfig
            fieldConfig.resolve = async function (...args) {
              const context = args[2]
              await validateServerRole(context, requiredRole)

              return await resolve.apply(this, args)
            }

            return fieldConfig
          }
        })
    }
  },

  /**
   * Ensure that the user has the specified STREAM role for a target stream (e.g. owner)
   *
   * Note: Only supported on Stream type fields!
   * @type {import('@/modules/core/graph/helpers/directiveHelper').GraphqlDirectiveBuilder}
   */
  hasStreamRole: () => {
    const directiveName = 'hasStreamRole'
    return {
      typeDefs: `
        enum StreamRole {
          STREAM_OWNER
          STREAM_CONTRIBUTOR
          STREAM_REVIEWER
        }

        """
        Ensure that the user has the specified STREAM role for a target stream (e.g. owner)

        Note: Only supported on Stream type fields!
        """
        directive @${directiveName}(role: StreamRole!) on FIELD_DEFINITION
      `,
      schemaTransformer: (schema) =>
        mapSchema(schema, {
          [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
            const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
            if (!directive) return undefined

            const { role } = directive
            const requiredRole = mapStreamRoleToValue(role)

            const { resolve = defaultFieldResolver } = fieldConfig
            fieldConfig.resolve = async function (...args) {
              const [parent, , context, info] = args

              // Validate stream role only if parent is a Stream type
              if (info.parentType?.name === 'Stream' && parent) {
                if (!parent.id) {
                  // This should never happen as long as our resolvers always return streams with their IDs
                  throw new ForbiddenError('Unexpected access of unidentifiable stream')
                }

                if (!context.userId) {
                  throw new ForbiddenError(
                    'User must be authenticated to access this data'
                  )
                }

                await authorizeResolver(context.userId, parent.id, requiredRole)
              }

              const data = await resolve.apply(this, args)
              return data
            }

            return fieldConfig
          }
        })
    }
  }
}
