import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  VersionNotFoundError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import {
  MaybeUserContext,
  ProjectContext,
  VersionContext
} from '../../../domain/context.js'
import { Loaders } from '../../../domain/loaders.js'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  ensureImplicitProjectMemberWithWriteAccessFragment,
  ensureMinimumProjectRoleFragment
} from '../../../fragments/projects.js'
import { Roles } from '../../../../core/constants.js'

export const canUpdateProjectVersionPolicy: AuthPolicy<
  | typeof Loaders.getVersion
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  MaybeUserContext & ProjectContext & VersionContext,
  InstanceType<
    | typeof ProjectNotFoundError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof VersionNotFoundError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof ServerNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ projectId, versionId, userId }) => {
    // Ensure general write access
    const ensuredWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId
    })
    if (ensuredWriteAccess.isErr) {
      return err(ensuredWriteAccess.error)
    }

    // Must be author or project owner to update version
    const version = await loaders.getVersion({ versionId, projectId })
    if (!version) {
      return err(new VersionNotFoundError())
    }

    if (!version.authorId || version.authorId !== userId) {
      // Not author - validate that user is project owner
      const ensuredOwner = await ensureMinimumProjectRoleFragment(loaders)({
        userId: userId!,
        projectId,
        role: Roles.Stream.Owner
      })
      if (ensuredOwner.isErr) {
        switch (ensuredOwner.error.code) {
          case ProjectNoAccessError.code:
            return err(
              new ProjectNoAccessError(
                "You do not have access to update other contributors' versions in this project"
              )
            )
          default:
            return err(ensuredOwner.error)
        }
      }
    }

    return ok()
  }
