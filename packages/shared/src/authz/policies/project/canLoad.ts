import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthPolicy } from '../../domain/policies.js'
import { Roles } from '../../../core/constants.js'
import { ensureImplicitProjectMemberWithWriteAccessFragment } from '../../fragments/projects.js'
import { Loaders } from '../../domain/loaders.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { checkIfAdminOverrideEnabledFragment } from '../../fragments/server.js'

type PolicyLoaderKeys =
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getAdminOverrideEnabled
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole

type PolicyArgs = ProjectContext & MaybeUserContext

type PolicyErrors = InstanceType<
  | typeof ProjectNoAccessError
  | typeof ProjectNotFoundError
  | typeof WorkspaceNoAccessError
  | typeof ServerNoAccessError
  | typeof ServerNoSessionError
  | typeof ServerNotEnoughPermissionsError
  | typeof WorkspaceSsoSessionNoAccessError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof ProjectNotEnoughPermissionsError
>

export const canLoadPolicy: AuthPolicy<PolicyLoaderKeys, PolicyArgs, PolicyErrors> =
  (loaders) =>
  async ({ userId, projectId }) => {
    if (publiclyLoadableProjects.includes(projectId)) {
      return ok()
    }
    const hasAdminAccess = await checkIfAdminOverrideEnabledFragment(loaders)({
      userId
    })
    if (hasAdminAccess.isOk && hasAdminAccess.value) {
      return ok()
    }
    const ensuredWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId,
      role: Roles.Stream.Contributor
    })
    if (ensuredWriteAccess.isErr) {
      if (ensuredWriteAccess.error.code === 'ProjectNotEnoughPermissions')
        return err(
          new ProjectNotEnoughPermissionsError({
            message: "Your role on this project doesn't give you permission to load."
          })
        )
      return err(ensuredWriteAccess.error)
    }

    return ok()
  }

const publiclyLoadableProjects = [
  '8be1007be1' // Demo models
]
