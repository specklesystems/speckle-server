import { AuthPolicy, ErrorsOf, LoadersOf } from '../../domain/policies.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError,
  WorkspaceNoEditorSeatError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { err, ok } from 'true-myth/result'
import { Roles } from '../../../core/constants.js'
import {
  ensureWorkspaceRoleAndSessionFragment,
  ensureWorkspacesEnabledFragment
} from '../../fragments/workspaces.js'
import { hasEditorSeat } from '../../checks/workspaceSeat.js'
import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import {
  isNewWorkspacePlan,
  isWorkspacePlanStatusReadOnly
} from '../../../workspaces/index.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { requireMinimumWorkspaceRole } from '../../checks/workspaceRole.js'

export const canCreateWorkspaceProjectPolicy: AuthPolicy<
  | 'getEnv'
  | 'getServerRole'
  | 'getWorkspace'
  | 'getWorkspaceRole'
  | 'getWorkspaceSeat'
  | 'getWorkspacePlan'
  | 'getWorkspaceLimits'
  | 'getWorkspaceProjectCount'
  | 'getWorkspaceSsoProvider'
  | 'getWorkspaceSsoSession'
  | LoadersOf<typeof ensureWorkspacesEnabledFragment>
  | LoadersOf<typeof ensureMinimumServerRoleFragment>
  | LoadersOf<typeof ensureWorkspaceRoleAndSessionFragment>,
  MaybeUserContext & WorkspaceContext,
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceReadOnlyError>
  | InstanceType<typeof WorkspaceNoEditorSeatError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceLimitsReachedError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
  | ErrorsOf<typeof ensureWorkspacesEnabledFragment>
  | ErrorsOf<typeof ensureMinimumServerRoleFragment>
  | ErrorsOf<typeof ensureWorkspaceRoleAndSessionFragment>
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const ensuredWorkspacesEnabled = await ensureWorkspacesEnabledFragment(loaders)({})
    if (ensuredWorkspacesEnabled.isErr) return err(ensuredWorkspacesEnabled.error)

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    const ensuredWorkspaceAccess = await ensureWorkspaceRoleAndSessionFragment(loaders)(
      {
        userId: userId!,
        workspaceId
      }
    )
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    // guests cannot create projects in the workspace
    const isNotGuest = await requireMinimumWorkspaceRole(loaders)({
      userId: userId!,
      workspaceId,
      role: Roles.Workspace.Member
    })

    if (!isNotGuest)
      return err(
        new WorkspaceNotEnoughPermissionsError({
          message: 'Guests cannot create projects in the workspace'
        })
      )

    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return err(new WorkspaceNoAccessError())

    if (isWorkspacePlanStatusReadOnly(workspacePlan.status))
      return err(new WorkspaceReadOnlyError())

    if (isNewWorkspacePlan(workspacePlan.name)) {
      const isEditor = await hasEditorSeat(loaders)({
        userId: userId!,
        workspaceId
      })
      if (!isEditor) return err(new WorkspaceNoEditorSeatError())
    }

    const workspaceLimits = await loaders.getWorkspaceLimits({ workspaceId })
    if (!workspaceLimits) return err(new WorkspaceNoAccessError())

    // no limits imposed
    if (workspaceLimits.projectCount === null) return ok()
    const currentProjectCount = await loaders.getWorkspaceProjectCount({
      workspaceId
    })

    // this will not happen in practice
    if (currentProjectCount === null) return err(new WorkspaceNoAccessError())

    return currentProjectCount < workspaceLimits.projectCount
      ? ok()
      : err(new WorkspaceLimitsReachedError({ payload: { limit: 'projectCount' } }))
  }
