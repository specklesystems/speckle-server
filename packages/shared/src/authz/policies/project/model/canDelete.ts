import { err, ok } from 'true-myth/result'
import {
  MaybeUserContext,
  ModelContext,
  ProjectContext
} from '../../../domain/context.js'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  ensureImplicitProjectMemberWithWriteAccessFragment,
  ensureMinimumProjectRoleFragment
} from '../../../fragments/projects.js'
import { Loaders } from '../../../domain/loaders.js'
import {
  ReservedModelNotDeletableError,
  ModelNotFoundError,
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError,
  ProjectNotEnoughPermissionsError,
  WorkspaceNotEnoughPermissionsError,
  ServerNotEnoughPermissionsError
} from '../../../domain/authErrors.js'
import { Roles } from '../../../../core/constants.js'

export const canDeleteModelPolicy: AuthPolicy<
  | typeof Loaders.getModel
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  ProjectContext & MaybeUserContext & ModelContext,
  InstanceType<
    | typeof ProjectNoAccessError
    | typeof ProjectNotFoundError
    | typeof WorkspaceNoAccessError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof ModelNotFoundError
    | typeof ReservedModelNotDeletableError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof ServerNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId, modelId }) => {
    // Ensure general project write access
    const ensureWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId
    })
    if (ensureWriteAccess.isErr) {
      return err(ensureWriteAccess.error)
    }

    // Ensure 'main'/'globals' doesn't get deleted
    const model = await loaders.getModel({
      projectId,
      modelId
    })
    if (!model) {
      return err(new ModelNotFoundError())
    }

    // Model must be owned by author OR user must be project owner
    if (!model.authorId || model.authorId !== userId) {
      const ensureProjectOwner = await ensureMinimumProjectRoleFragment(loaders)({
        userId: userId!,
        projectId,
        role: Roles.Stream.Owner
      })
      if (ensureProjectOwner.isErr) {
        return err(ensureProjectOwner.error)
      }
    }

    if (model.name === 'main') {
      return err(
        new ReservedModelNotDeletableError("The 'main' model cannot be deleted")
      )
    }
    if (model.name === 'globals') {
      return err(
        new ReservedModelNotDeletableError("The 'globals' model cannot be deleted")
      )
    }

    return ok()
  }
