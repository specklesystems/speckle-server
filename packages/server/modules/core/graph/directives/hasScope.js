const { defaultFieldResolver } = require('graphql')
const { validateScopes } = require('@/modules/shared')
const { mapSchema, MapperKind, getDirective } = require('@graphql-tools/utils')

module.exports = {
  /**
   * Ensure that the user's access token has the specified scope allowed for it
   * @type {import('@/modules/core/graph/helpers/directiveHelper').GraphqlDirectiveBuilder}
   */
  hasScope: () => {
    const directiveName = 'hasScope'
    return {
      typeDefs: `
        """
        Ensure that the active user's access token has the specified scope allowed for it
        """
        directive @${directiveName}(scope: String!) on FIELD_DEFINITION
      `,
      schemaTransformer: (schema) =>
        mapSchema(schema, {
          [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
            const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
            if (!directive) return undefined

            const { scope: requiredScope } = directive
            const { resolve = defaultFieldResolver } = fieldConfig
            fieldConfig.resolve = async function (...args) {
              const context = args[2]
              const currentScopes = context.scopes
              await validateScopes(currentScopes, requiredScope)

              const data = await resolve.apply(this, args)
              return data
            }

            return fieldConfig
          }
        })
    }
  },

  /**
   * Ensure that the user's access token has all of the specified scopes allowed for it
   * @type {import('@/modules/core/graph/helpers/directiveHelper').GraphqlDirectiveBuilder}
   */
  hasScopes: () => {
    const directiveName = 'hasScopes'
    return {
      typeDefs: `
        """
        Ensure that the user's access token has all of the specified scopes allowed for it
        """
        directive @${directiveName}(scopes: [String]!) on FIELD_DEFINITION
      `,
      schemaTransformer: (schema) =>
        mapSchema(schema, {
          [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
            const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
            if (!directive) return undefined

            const { scopes: requiredScopes } = directive
            const { resolve = defaultFieldResolver } = fieldConfig

            fieldConfig.resolve = async function (...args) {
              const context = args[2]
              const currentScopes = context.scopes

              await Promise.all(
                requiredScopes.map(async (requiredScope) => {
                  validateScopes(currentScopes, requiredScope)
                })
              )

              const data = await resolve.apply(this, args)
              return data
            }

            return fieldConfig
          }
        })
    }
  }
}
