import { err, ok } from 'true-myth/result'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  CommentContext,
  MaybeUserContext,
  ProjectContext
} from '../../../domain/context.js'
import { Loaders } from '../../../domain/loaders.js'
import {
  CommentNoAccessError,
  CommentNotFoundError,
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { canCreateProjectCommentPolicy } from './canCreate.js'

export const canEditProjectCommentPolicy: AuthPolicy<
  | typeof Loaders.getServerRole
  | typeof Loaders.getComment
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  MaybeUserContext & CommentContext & ProjectContext,
  InstanceType<
    | typeof ProjectNoAccessError
    | typeof ProjectNotFoundError
    | typeof WorkspaceNoAccessError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof CommentNotFoundError
    | typeof CommentNoAccessError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof ServerNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, commentId, projectId }) => {
    // Includes canCreate check
    const canCreate = await canCreateProjectCommentPolicy(loaders)({
      userId,
      projectId
    })
    if (canCreate.isErr) {
      return err(canCreate.error)
    }

    // Check that comment exists
    const comment = await loaders.getComment({ commentId, projectId })
    if (!comment) return err(new CommentNotFoundError())

    // Disallow if user is not the author
    if (comment.authorId !== userId) {
      return err(
        new CommentNoAccessError('You do not have access to edit this comment')
      )
    }

    return ok()
  }
