import { err, ok } from 'true-myth/result'
import {
  PersonalProjectsLimitedError,
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError,
  WorkspaceNoEditorSeatError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceProjectMoveInvalidError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import {
  MaybeProjectContext,
  MaybeUserContext,
  MaybeWorkspaceContext
} from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { Roles } from '../../../core/constants.js'
import {
  ensureModelCanBeCreatedFragment,
  ensureWorkspaceProjectCanBeCreatedFragment,
  ensureWorkspaceRoleAndSessionFragment,
  ensureWorkspacesEnabledFragment
} from '../../fragments/workspaces.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { ensureMinimumProjectRoleFragment } from '../../fragments/projects.js'

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
  | typeof AuthCheckContextLoaderKeys.getProjectModelCount
  | typeof AuthCheckContextLoaderKeys.getWorkspaceModelCount
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSeat

type PolicyArgs = MaybeUserContext & MaybeProjectContext & MaybeWorkspaceContext

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
  | InstanceType<typeof ServerNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceNoEditorSeatError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>
  | InstanceType<typeof ProjectNotEnoughPermissionsError>
  | InstanceType<typeof PersonalProjectsLimitedError>

export const canMoveToWorkspacePolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, projectId, workspaceId }) => {
    const ensuredWorkspacesEnabled = await ensureWorkspacesEnabledFragment(loaders)({})
    if (ensuredWorkspacesEnabled.isErr) return err(ensuredWorkspacesEnabled.error)

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    if (projectId) {
      // We do not support moving projects that are already in a workspace
      const project = await loaders.getProject({ projectId })
      if (!project) return err(new ProjectNotFoundError())
      if (!!project.workspaceId) return err(new WorkspaceProjectMoveInvalidError())

      const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
        userId: userId!,
        projectId,
        role: Roles.Stream.Owner
      })
      if (ensuredProjectRole.isErr) {
        return err(ensuredProjectRole.error)
      }
    }

    if (workspaceId) {
      const ensuredWorkspaceAccess = await ensureWorkspaceRoleAndSessionFragment(
        loaders
      )({
        userId: userId!,
        workspaceId,
        role: Roles.Workspace.Admin
      })
      if (ensuredWorkspaceAccess.isErr) return err(ensuredWorkspaceAccess.error)

      // Ensure workspace accepts new projects
      const ensuredProjectsAccepted = await ensureWorkspaceProjectCanBeCreatedFragment(
        loaders
      )({
        workspaceId,
        userId
      })
      if (ensuredProjectsAccepted.isErr) {
        return err(ensuredProjectsAccepted.error)
      }
    }

    if (workspaceId && projectId) {
      // Check whether this specific project can be moved to the workspace
      // Does it maybe have too many models?
      const projectModelCount = await loaders.getProjectModelCount({
        projectId
      })
      const ensuredModelsAccepted = await ensureModelCanBeCreatedFragment(loaders)({
        projectId,
        userId,
        addedModelCount: projectModelCount,
        workspaceId
      })
      if (ensuredModelsAccepted.isErr) {
        return err(ensuredModelsAccepted.error)
      }
    }

    return ok()
  }
