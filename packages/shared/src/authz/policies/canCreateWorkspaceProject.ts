import { AuthPolicy } from '../domain/policies.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError,
  WorkspaceNoEditorSeatError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { err, ok } from 'true-myth/result'
import { hasMinimumServerRole } from '../checks/serverRole.js'
import { Roles } from '../../core/constants.js'
import { maybeMemberRoleWithValidSsoSessionIfNeeded } from '../fragments/workspaceSso.js'
import { hasAnyWorkspaceRole } from '../checks/workspaceRole.js'
import { throwUncoveredError } from '../../core/index.js'
import { hasEditorSeat } from '../checks/workspaceSeat.js'
import { MaybeUserContext, WorkspaceContext } from '../domain/context.js'

export const canCreateWorkspaceProjectPolicy: AuthPolicy<
  | 'getEnv'
  | 'getServerRole'
  | 'getWorkspace'
  | 'getWorkspaceRole'
  | 'getWorkspaceSeat'
  | 'getWorkspaceLimits'
  | 'getWorkspaceProjectCount'
  | 'getWorkspaceSsoProvider'
  | 'getWorkspaceSsoSession',
  MaybeUserContext & WorkspaceContext,
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceNoEditorSeatError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceLimitsReachedError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const env = await loaders.getEnv()
    if (!env.FF_WORKSPACES_MODULE_ENABLED) return err(new WorkspacesNotEnabledError())
    if (!userId) return err(new ServerNoSessionError())

    const isActiveServerUser = await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (!isActiveServerUser) return err(new ServerNoAccessError())

    if (!(await hasAnyWorkspaceRole(loaders)({ userId, workspaceId })))
      return err(new WorkspaceNoAccessError())
    const memberWithSsoSession = await maybeMemberRoleWithValidSsoSessionIfNeeded(
      loaders
    )({
      userId,
      workspaceId
    })
    // guests cannot create projects in the workspace
    if (memberWithSsoSession.isNothing)
      return err(
        new WorkspaceNotEnoughPermissionsError({
          message: 'Guests cannot create projects in the workspace'
        })
      )

    // if sso session is not valid, return errors
    if (memberWithSsoSession.value.isErr) {
      switch (memberWithSsoSession.value.error.code) {
        case 'WorkspaceNoAccess':
        case 'WorkspaceSsoSessionNoAccess':
          return err(memberWithSsoSession.value.error)
        default:
          throwUncoveredError(memberWithSsoSession.value.error)
      }
    }

    // check workspace plan active

    // const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    // if (!workspaceLimits) return err(new WorkspaceNoAccessError())

    // TODO: change check, load plan and make sure its a new type plan
    if (env.FF_WORKSPACES_NEW_PLANS_ENABLED) {
      const isEditor = await hasEditorSeat(loaders)({
        userId,
        workspaceId
      })
      if (!isEditor) return err(new WorkspaceNoEditorSeatError())
    }

    // const workspaceLimits = await loaders.getWorkspaceLimits({ workspaceId })
    // this will not happen in practice
    // no limits imposed
    // if (!workspaceLimits.projectCount) return ok()
    const currentProjectCount = await loaders.getWorkspaceProjectCount({
      workspaceId
    })
    // this will not happen in practice
    if (!currentProjectCount) return err(new WorkspaceNoAccessError())
    // return currentProjectCount < workspaceLimits.projectCount
    // ? ok()
    // : err(new WorkspaceLimitsReachedError({ payload: { limit: 'projectCount' } }))
    //
    return ok()
  }
