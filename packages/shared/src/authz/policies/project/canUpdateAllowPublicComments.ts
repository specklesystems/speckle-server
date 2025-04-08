import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthPolicy } from '../../domain/policies.js'
import { Loaders } from '../../domain/loaders.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { canUpdateProjectPolicy } from './canUpdate.js'

export const canUpdateProjectAllowPublicCommentsPolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  ProjectContext & MaybeUserContext,
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
    // Invoke full canUpdate policy, that's still the base
    const canUpdate = await canUpdateProjectPolicy(loaders)({
      userId,
      projectId
    })
    if (canUpdate.isErr) {
      return err(canUpdate.error)
    }

    // Project must also be publicly visible
    const project = await loaders.getProject({ projectId })
    if (!project) {
      return err(new ProjectNotFoundError())
    }

    const isPublic = project.isPublic || project.isDiscoverable
    return isPublic
      ? ok()
      : err(
          new ProjectNoAccessError({
            message: 'Project must be public to allow public comments'
          })
        )
  }
