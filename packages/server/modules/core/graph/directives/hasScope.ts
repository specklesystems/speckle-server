import { defaultFieldResolver } from 'graphql'
import { mapSchema, MapperKind, getDirective } from '@graphql-tools/utils'
import { GraphqlDirectiveBuilder } from '@/modules/core/graph/helpers/directiveHelper'
import { validateScopesFactory } from '@/modules/shared/services/auth'

const validateScopes = validateScopesFactory()

/**
 * Ensure that the user's access token has the specified scope allowed for it
 */
export const hasScope: GraphqlDirectiveBuilder = () => {
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
}

/**
 * Ensure that the user's access token has all of the specified scopes allowed for it
 */
export const hasScopes: GraphqlDirectiveBuilder = () => {
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
              requiredScopes.map(async (requiredScope: string) => {
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
