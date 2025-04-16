import { err, ok } from 'true-myth/result'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  CommentContext,
  MaybeUserContext,
  ProjectContext
} from '../../../domain/context.js'
import { Loaders } from '../../../domain/loaders.js'
import {
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
import { ensureImplicitProjectMemberWithWriteAccessFragment } from '../../../fragments/projects.js'
import { Roles } from '../../../../core/constants.js'
import { canCreateProjectCommentPolicy } from './canCreate.js'

export const canArchiveProjectCommentPolicy: AuthPolicy<
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
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof ServerNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, commentId, projectId }) => {
    // Includes canCreate check (checks general comment write access,
    // cause just owning a comment is not enough, if you've been banned from it)
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

    // If user is owner, no extra checks necessary
    if (comment.authorId === userId) return ok()

    // Otherwise Ensure proper project owner level write access
    const ensuredWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId,
      role: Roles.Stream.Owner
    })
    if (ensuredWriteAccess.isErr) {
      return err(ensuredWriteAccess.error)
    }

    return ok()
  }
