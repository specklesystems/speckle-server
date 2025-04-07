import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError,
  WorkspaceProjectMoveInvalidError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import {
  MaybeUserContext,
  ProjectContext,
  WorkspaceContext
} from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { hasMinimumServerRole } from '../../checks/serverRole.js'
import { Roles } from '../../../core/constants.js'
import { hasMinimumProjectRole } from '../../checks/projects.js'
import { hasMinimumWorkspaceRole } from '../../checks/workspaceRole.js'
import { maybeMemberRoleWithValidSsoSessionIfNeeded } from '../../fragments/workspaceSso.js'
import { throwUncoveredError } from '../../../core/index.js'
import { isWorkspacePlanStatusReadOnly } from '../../../workspaces/index.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getProject
  | typeof AuthCheckContextLoaderKeys.getProjectRole
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan
  | typeof AuthCheckContextLoaderKeys.getWorkspaceLimits
  | typeof AuthCheckContextLoaderKeys.getWorkspaceProjectCount

type PolicyArgs = MaybeUserContext & ProjectContext & WorkspaceContext

type PolicyErrors =
  | InstanceType<typeof ProjectNotFoundError>
  | InstanceType<typeof ProjectNoAccessError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceReadOnlyError>
  | InstanceType<typeof WorkspaceLimitsReachedError>
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof WorkspaceProjectMoveInvalidError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>

export const canMoveToWorkspacePolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, projectId, workspaceId }) => {
    const env = await loaders.getEnv()
    if (!userId) return err(new ServerNoSessionError())
    if (!env.FF_WORKSPACES_MODULE_ENABLED) return err(new WorkspacesNotEnabledError())

    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())
    if (!!project.workspaceId) return err(new WorkspaceProjectMoveInvalidError())

    const isServerUser = await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (!isServerUser) return err(new ServerNoAccessError())

    const isProjectOwner = await hasMinimumProjectRole(loaders)({
      userId,
      projectId,
      role: Roles.Stream.Owner
    })
    if (!isProjectOwner) return err(new ProjectNoAccessError())

    const isWorkspaceAdmin = await hasMinimumWorkspaceRole(loaders)({
      userId,
      workspaceId,
      role: Roles.Workspace.Admin
    })
    if (!isWorkspaceAdmin) return err(new WorkspaceNoAccessError())

    const maybeMemberWithSsoSession = await maybeMemberRoleWithValidSsoSessionIfNeeded(
      loaders
    )({
      userId,
      workspaceId
    })

    if (!maybeMemberWithSsoSession.isNothing && maybeMemberWithSsoSession.value.isErr) {
      switch (maybeMemberWithSsoSession.value.error.code) {
        case 'WorkspaceNoAccess':
        case 'WorkspaceSsoSessionNoAccess':
          return err(maybeMemberWithSsoSession.value.error)
        default:
          throwUncoveredError(maybeMemberWithSsoSession.value.error)
      }
    }

    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return err(new WorkspaceNoAccessError())
    if (isWorkspacePlanStatusReadOnly(workspacePlan.status))
      return err(new WorkspaceReadOnlyError())

    const workspaceLimits = await loaders.getWorkspaceLimits({ workspaceId })
    if (!workspaceLimits) return err(new WorkspaceNoAccessError())

    if (workspaceLimits.projectCount === null) return ok()

    const currentProjectCount = await loaders.getWorkspaceProjectCount({ workspaceId })

    if (currentProjectCount === null) return err(new WorkspaceNoAccessError())

    return currentProjectCount < workspaceLimits.projectCount
      ? ok()
      : err(new WorkspaceLimitsReachedError({ payload: { limit: 'projectCount' } }))
  }
