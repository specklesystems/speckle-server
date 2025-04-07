import { Roles } from '../../../core/constants.js'
import { err, ok } from 'true-myth/result'
import { AuthPolicy, ErrorsOf, LoadersOf } from '../../domain/policies.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import {
  checkIfPubliclyReadableProjectFragment,
  ensureMinimumProjectRoleFragment,
  ensureProjectWorkspaceAccessFragment
} from '../../fragments/projects.js'
import {
  checkIfAdminOverrideEnabledFragment,
  ensureMinimumServerRoleFragment
} from '../../fragments/server.js'

export const canReadProjectPolicy: AuthPolicy<
  | LoadersOf<typeof checkIfPubliclyReadableProjectFragment>
  | LoadersOf<typeof ensureMinimumServerRoleFragment>
  | LoadersOf<typeof ensureMinimumProjectRoleFragment>
  | LoadersOf<typeof checkIfAdminOverrideEnabledFragment>
  | LoadersOf<typeof ensureProjectWorkspaceAccessFragment>,
  MaybeUserContext & ProjectContext,
  | ErrorsOf<typeof ensureMinimumServerRoleFragment>
  | ErrorsOf<typeof ensureMinimumProjectRoleFragment>
  | ErrorsOf<typeof ensureProjectWorkspaceAccessFragment>
  | ErrorsOf<typeof checkIfPubliclyReadableProjectFragment>
  | ErrorsOf<typeof checkIfAdminOverrideEnabledFragment>
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    // All users may read public projects
    const isPubliclyReadable = await checkIfPubliclyReadableProjectFragment(loaders)({
      projectId
    })
    if (isPubliclyReadable.isErr) {
      return err(isPubliclyReadable.error)
    }
    if (isPubliclyReadable.value) return ok()

    // Not public. Ensure user is authed
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.Guest
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    // Check if user has admin override enabled
    const isAdminOverrideEnabled = await checkIfAdminOverrideEnabledFragment(loaders)({
      userId
    })
    if (isAdminOverrideEnabled.isErr) {
      return err(isAdminOverrideEnabled.error)
    }
    if (isAdminOverrideEnabled.value) return ok()

    // No god mode, ensure workspace access
    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    // And ensure (implicit/explicit) project role
    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredProjectRole.isErr) {
      return err(ensuredProjectRole.error)
    }

    return ok()
  }
