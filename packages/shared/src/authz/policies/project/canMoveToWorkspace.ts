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
import { Roles } from '../../../core/constants.js'
import { hasMinimumWorkspaceRole } from '../../checks/workspaceRole.js'
import { isWorkspacePlanStatusReadOnly } from '../../../workspaces/index.js'
import { ensureWorkspacesEnabledFragment } from '../../fragments/workspaces.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import {
  ensureMinimumProjectRoleFragment,
  ensureProjectWorkspaceAccessFragment
} from '../../fragments/projects.js'

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
    const ensuredWorkspacesEnabled = await ensureWorkspacesEnabledFragment(loaders)({})
    if (ensuredWorkspacesEnabled.isErr) return err(ensuredWorkspacesEnabled.error)

    // We do not support moving projects that are already in a workspace
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())
    if (!!project.workspaceId) return err(new WorkspaceProjectMoveInvalidError())

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId,
      role: Roles.Stream.Owner
    })
    if (ensuredProjectRole.isErr) return err(ensuredProjectRole.error)

    const isWorkspaceAdmin = await hasMinimumWorkspaceRole(loaders)({
      userId: userId!,
      workspaceId,
      role: Roles.Workspace.Admin
    })
    if (!isWorkspaceAdmin) return err(new WorkspaceNoAccessError())

    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) return err(ensuredWorkspaceAccess.error)

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
