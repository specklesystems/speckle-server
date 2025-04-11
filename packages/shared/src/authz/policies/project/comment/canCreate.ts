import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext } from '../../../domain/context.js'
import { AuthPolicy } from '../../../domain/policies.js'
import { ensureMinimumServerRoleFragment } from '../../../fragments/server.js'
import { Loaders } from '../../../domain/loaders.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { ensureImplicitProjectMemberWithWriteAccessFragment } from '../../../fragments/projects.js'
import { Roles } from '../../../../core/constants.js'

export const canCreateProjectCommentPolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  MaybeUserContext & ProjectContext,
  InstanceType<
    | typeof ProjectNoAccessError
    | typeof ProjectNotFoundError
    | typeof WorkspaceNoAccessError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof WorkspaceSsoSessionNoAccessError
  >
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    // Ensure server access
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    // Check if public commenting enabled
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())
    const allowPublicCommenting =
      (project.isPublic || project.isDiscoverable) && project.allowPublicComments
    if (allowPublicCommenting) return ok()

    // Not public, ensure proper project write access
    const ensuredWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId,
      role: Roles.Stream.Reviewer
    })
    if (ensuredWriteAccess.isErr) {
      return err(ensuredWriteAccess.error)
    }

    return ok()
  }
