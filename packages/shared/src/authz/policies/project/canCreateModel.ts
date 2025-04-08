import { err, ok } from 'true-myth/result'
import {
  ProjectNotFoundError,
  ProjectNoAccessError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError,
  WorkspaceLimitsReachedError,
  ServerNoSessionError,
  ServerNoAccessError,
  WorkspaceReadOnlyError
} from '../../domain/authErrors.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { Roles } from '../../../core/constants.js'
import { isWorkspacePlanStatusReadOnly } from '../../../workspaces/index.js'
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
  | typeof AuthCheckContextLoaderKeys.getWorkspaceModelCount

type PolicyArgs = MaybeUserContext & ProjectContext

type PolicyErrors =
  | InstanceType<typeof ProjectNotFoundError>
  | InstanceType<typeof ProjectNoAccessError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceReadOnlyError>
  | InstanceType<typeof WorkspaceLimitsReachedError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>

export const canCreateModelPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.Guest
    })
    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId,
      role: Roles.Stream.Contributor
    })
    if (ensuredProjectRole.isErr) return err(ensuredProjectRole.error)

    const project = await loaders.getProject({ projectId })

    // Projects outside of a workspace do not need to check workspace limits
    if (!project?.workspaceId) {
      return ok()
    }

    const { workspaceId } = project

    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return err(new WorkspaceNoAccessError())
    if (isWorkspacePlanStatusReadOnly(workspacePlan.status))
      return err(new WorkspaceReadOnlyError())

    const workspaceLimits = await loaders.getWorkspaceLimits({ workspaceId })
    if (!workspaceLimits) return err(new WorkspaceNoAccessError())

    if (workspaceLimits.modelCount === null) return ok()

    const currentModelCount = await loaders.getWorkspaceModelCount({ workspaceId })

    if (currentModelCount === null) return err(new WorkspaceNoAccessError())

    return currentModelCount < workspaceLimits.modelCount
      ? ok()
      : err(new WorkspaceLimitsReachedError({ payload: { limit: 'modelCount' } }))
  }
