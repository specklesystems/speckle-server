/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForbiddenError } from '@/modules/shared/errors'
import { GraphQLField, defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

/**
 * Ensure that the authenticated user owns the object whose properties
 * are being accessed
 *
 * Note: Only supported when added onto the fields that are directly defined on the
 * owned object.
 * Note 2: Only supports the following types currently: User
 */
export const isOwner = class IsOwnerDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(
    field: GraphQLField<any, any, { [key: string]: any }>
  ): void | GraphQLField<any, any, { [key: string]: any }> | null {
    const resolver = field.resolve || defaultFieldResolver

    const fieldName = field.name
    field.resolve = async function (parent, args, context, info) {
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

      const data = await resolver.call(this, parent, args, context, info)
      return data
    }
  }
}
