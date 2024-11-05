import { defaultFieldResolver } from 'graphql'
import { ForbiddenError } from '@/modules/shared/errors'
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'
import {
  mapStreamRoleToValue,
  mapServerRoleToValue
} from '@/modules/core/helpers/graphTypes'
import {
  throwForNotHavingServerRoleFactory,
  validateServerRoleBuilderFactory
} from '@/modules/shared/authz'
import { GraphqlDirectiveBuilder } from '@/modules/core/graph/helpers/directiveHelper'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { db } from '@/db/knex'
import { authorizeResolverFactory } from '@/modules/shared/services/auth'
import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'
import {
  getUserAclRoleFactory,
  getUserServerRoleFactory
} from '@/modules/shared/repositories/acl'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getEventBus } from '@/modules/shared/services/eventBus'

const getStream = getStreamFactory({ db })
const throwForNotHavingServerRole = throwForNotHavingServerRoleFactory({
  validateServerRole: validateServerRoleBuilderFactory({
    getRoles: getRolesFactory({ db })
  })
})
const authorizeResolver = authorizeResolverFactory({
  getRoles: getRolesFactory({ db }),
  adminOverrideEnabled,
  getUserServerRole: getUserServerRoleFactory({ db }),
  getStream,
  getUserAclRole: getUserAclRoleFactory({ db }),
  emitWorkspaceEvent: getEventBus().emit
})

/**
 * Ensure that the user has the specified SERVER role (e.g. server user, admin etc.)
 */
export const hasServerRole: GraphqlDirectiveBuilder = () => {
  const directiveName = 'hasServerRole'
  return {
    typeDefs: `
        enum ServerRole {
          SERVER_USER
          SERVER_ADMIN
          SERVER_GUEST
          SERVER_ARCHIVED_USER
        }

        """
        Ensure that the user has the specified SERVER role (e.g. server user, admin etc.)
        """
        directive @${directiveName}(role: ServerRole!) on FIELD_DEFINITION
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
            await throwForNotHavingServerRole(
              context,
              mapServerRoleToValue(requiredRole)
            )

            return await resolve.apply(this, args)
          }

          return fieldConfig
        }
      })
  }
}

/**
 * Ensure that the user has the specified STREAM role for a target stream (e.g. owner)
 *
 * Note: Only supported on Stream/Project type fields!
 */
export const hasStreamRole: GraphqlDirectiveBuilder = () => {
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
            if (['Stream', 'Project'].includes(info.parentType?.name) && parent) {
              if (!parent.id) {
                // This should never happen as long as our resolvers always return streams with their IDs
                throw new ForbiddenError('Unexpected access of unidentifiable stream')
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
