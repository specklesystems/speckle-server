import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthPolicy, ErrorsOf, LoadersOf } from '../../domain/policies.js'
import { Roles } from '../../../core/constants.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import {
  ensureMinimumProjectRoleFragment,
  ensureProjectWorkspaceAccessFragment
} from '../../fragments/projects.js'

export const canUpdateProjectPolicy: AuthPolicy<
  | LoadersOf<typeof ensureMinimumProjectRoleFragment>
  | LoadersOf<typeof ensureMinimumServerRoleFragment>
  | LoadersOf<typeof ensureProjectWorkspaceAccessFragment>,
  ProjectContext & MaybeUserContext,
  | ErrorsOf<typeof ensureMinimumServerRoleFragment>
  | ErrorsOf<typeof ensureProjectWorkspaceAccessFragment>
  | ErrorsOf<typeof ensureMinimumProjectRoleFragment>
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId,
      role: Roles.Stream.Owner
    })
    if (ensuredProjectRole.isErr) {
      return err(ensuredProjectRole.error)
    }

    return ok()
  }
