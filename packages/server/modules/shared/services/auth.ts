import { GetStream } from '@/modules/core/domain/streams/operations'
import {
  isResourceAllowed,
  RoleResourceTargets,
  roleResourceTypeToTokenResourceType
} from '@/modules/core/helpers/token'
import {
  AuthorizeResolver,
  GetUserAclRole,
  GetUserServerRole,
  ValidateScopes
} from '@/modules/shared/domain/operations'
import { GetRoles } from '@/modules/shared/domain/rolesAndScopes/operations'
import { ForbiddenError } from '@/modules/shared/errors'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { GetWorkspaceRoleAndSeat } from '@/modules/workspacesCore/domain/operations'
import { isNullOrUndefined, Roles } from '@speckle/shared'
import { OperationTypeNode } from 'graphql'

/**
 * Validates the scope against a list of scopes of the current session.
 */
export const validateScopesFactory = (): ValidateScopes => async (scopes, scope) => {
  const errMsg = `Your auth token does not have the required scope${
    scope?.length ? ': ' + scope + '.' : '.'
  }`

  if (!scopes) throw new ForbiddenError(errMsg, { info: { scope } })
  if (scopes.indexOf(scope) === -1 && scopes.indexOf('*') === -1)
    throw new ForbiddenError(errMsg, { info: { scope } })
}

const workspaceRoleImplicitProjectRoleMap = <const>{
  [Roles.Workspace.Admin]: Roles.Stream.Owner,
  [Roles.Workspace.Member]: Roles.Stream.Reviewer,
  [Roles.Workspace.Guest]: null
}

/**
 * Checks the userId against the resource's acl.
 */
export const authorizeResolverFactory =
  (deps: {
    getRoles: GetRoles
    adminOverrideEnabled: boolean
    getUserServerRole: GetUserServerRole
    getStream: GetStream
    getUserAclRole: GetUserAclRole
    getWorkspaceRoleAndSeat: GetWorkspaceRoleAndSeat
    emitWorkspaceEvent: EventBusEmit
  }): AuthorizeResolver =>
  async (userId, resourceId, requiredRole, userResourceAccessLimits, operationType) => {
    userId = userId || null
    const roles = await deps.getRoles()

    // TODO: Cache these results with a TTL of 1 mins or so, it's pointless to query the db every time we get a ping.

    const role = roles.find((r) => r.name === requiredRole)
    if (!role) throw new ForbiddenError('Unknown role: ' + requiredRole)

    const resourceRuleType = roleResourceTypeToTokenResourceType(role.resourceTarget)
    const isResourceLimited =
      resourceRuleType &&
      !isResourceAllowed({
        resourceId,
        resourceType: resourceRuleType,
        resourceAccessRules: userResourceAccessLimits
      })
    if (isResourceLimited) {
      throw new ForbiddenError('You are not authorized to access this resource.')
    }

    if (
      deps.adminOverrideEnabled &&
      userId &&
      (!operationType || operationType === OperationTypeNode.QUERY)
    ) {
      const serverRole = await deps.getUserServerRole({ userId })
      if (serverRole === Roles.Server.Admin) return
    }

    let targetWorkspaceId: string | null = null

    if (role.resourceTarget === RoleResourceTargets.Streams) {
      const stream = await deps.getStream({
        userId: userId || undefined,
        streamId: resourceId
      })

      if (!stream) {
        throw new ForbiddenError(
          `Resource of type ${role.resourceTarget} with ${resourceId} not found`
        )
      }

      targetWorkspaceId = stream.workspaceId

      const isPublic = !!stream?.isPublic
      if (isPublic && role.weight < 200) return
    }

    if (role.resourceTarget === RoleResourceTargets.Workspaces) {
      targetWorkspaceId = resourceId
    }

    let userAclRole = userId
      ? await deps.getUserAclRole({
          aclTableName: role.aclTableName,
          userId,
          resourceId
        })
      : null

    if (!userAclRole) {
      // TODO: Could be more optimized (caching?) but we're moving away from this towards
      // auth policies anyway
      // Check if workspace role allows for stream actions
      if (
        role.resourceTarget === RoleResourceTargets.Streams &&
        targetWorkspaceId &&
        userId
      ) {
        const workspaceRoleAndSeat = await deps.getWorkspaceRoleAndSeat({
          workspaceId: targetWorkspaceId,
          userId
        })
        const implicitStreamRole =
          workspaceRoleAndSeat?.role.role &&
          workspaceRoleImplicitProjectRoleMap[workspaceRoleAndSeat.role.role]
        userAclRole = implicitStreamRole
      }

      if (!userAclRole) {
        throw new ForbiddenError('You are not authorized to access this resource.')
      }
    }

    const fullRole = roles.find((r) => r.name === userAclRole)

    if (fullRole && fullRole.weight < role.weight) {
      throw new ForbiddenError('You are not authorized.')
    }

    if (!isNullOrUndefined(targetWorkspaceId)) {
      await deps.emitWorkspaceEvent({
        eventName: WorkspaceEvents.Authorizing,
        payload: {
          workspaceId: targetWorkspaceId,
          userId
        }
      })
    }
  }
