import { GraphqlDirectiveBuilder } from '@/modules/core/graph/helpers/directiveHelper'
import { authorizeResolver } from '@/modules/shared'
import { ForbiddenError } from '@/modules/shared/errors'
import { mapGqlWorkspaceRoleToMainRole } from '@/modules/workspaces/helpers/roles'
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'
import { defaultFieldResolver } from 'graphql'

export const hasWorkspaceRole: GraphqlDirectiveBuilder = () => {
  const directiveName = 'hasWorkspaceRole'
  return {
    typeDefs: `
      enum WorkspaceRole {
        ADMIN
        MEMBER
        GUEST
      }

      """
      Ensure that the active user has the specified Workspace role
      Note: Only supported on Workspace type fields
      """
      directive @${directiveName}(role: WorkspaceRole!) on FIELD_DEFINITION
    `,
    schemaTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
          if (!directive) return undefined

          const { role } = directive
          const requiredRole = mapGqlWorkspaceRoleToMainRole(role)

          const { resolve = defaultFieldResolver } = fieldConfig
          fieldConfig.resolve = async function (...args) {
            const [parent, , context, info] = args

            // Validate stream role only if parent is a Stream type
            if (
              ['Workspace'].includes(info.parentType?.name) &&
              parent &&
              !('$ref' in parent)
            ) {
              if (!parent.id) {
                // This should never happen as long as our resolvers always return workspaces with their IDs
                throw new ForbiddenError(
                  'Unexpected access of unidentifiable workspace'
                )
              }

              if (!context.userId) {
                throw new ForbiddenError(
                  'User must be authenticated to access this data'
                )
              }

              await authorizeResolver(
                context.userId,
                parent.id,
                requiredRole,
                context.resourceAccessRules
              )
            }

            const data = await resolve.apply(this, args)
            return data
          }

          return fieldConfig
        }
      })
  }
}
