import { GraphqlDirectiveBuilder } from '@/modules/core/graph/helpers/directiveHelper'
import { ForbiddenError } from '@/modules/shared/errors'
import { getDirective } from '@graphql-tools/utils'
import { mapSchema } from '@graphql-tools/utils'
import { MapperKind } from '@graphql-tools/utils'
import { defaultFieldResolver } from 'graphql'

/**
 * Ensure that the authenticated user owns the object whose properties
 * are being accessed
 *
 * Note: Only supported when added onto the fields that are directly defined on the
 * owned object.
 * Note 2: Only supports the following types currently: User
 */
export const isOwner: GraphqlDirectiveBuilder = () => {
  const directiveName = 'isOwner'
  return {
    typeDefs: `
      """
      Ensure that the authenticated user owns the object whose properties
      are being accessed

      Note: Only supported when added onto the fields that are directly defined on the
      owned object.

      Note 2: Only supports the following types currently: User
      """
      directive @${directiveName} on FIELD_DEFINITION
    `,
    schemaTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName) => {
          const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
          if (!directive) return undefined

          const { resolve = defaultFieldResolver } = fieldConfig
          fieldConfig.resolve = async function (...args) {
            const [parent, , context, info] = args

            if (!parent.id) {
              // This should never happen as long as our resolvers always return objects with their IDs
              throw new ForbiddenError('Unexpected access of unidentifiable object')
            }
            if (!context.userId) {
              throw new ForbiddenError('You must be authenticated to access this data')
            }

            const parentId = parent.id
            const authUserId = context.userId

            if (info.parentType?.name === 'User') {
              if (parentId !== authUserId) {
                throw new ForbiddenError(
                  `You must be authenticated as the user whose '${fieldName}' value you wish to retrieve`
                )
              }
            }

            const data = await resolve.apply(this, args)
            return data
          }

          return fieldConfig
        }
      })
  }
}
