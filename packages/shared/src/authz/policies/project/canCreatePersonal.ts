import { err, ok } from 'true-myth/result'
import { MaybeUserContext } from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { Roles } from '../../../core/constants.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import {
  PersonalProjectsLimitedError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError
} from '../../domain/authErrors.js'

export const canCreatePersonalProjectPolicy: AuthPolicy<
  typeof Loaders.getServerRole | typeof Loaders.getEnv,
  MaybeUserContext,
  InstanceType<
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ServerNotEnoughPermissionsError
    | typeof PersonalProjectsLimitedError
  >
> =
  (loaders) =>
  async ({ userId }) => {
    const env = await loaders.getEnv()
    if (env.FF_PERSONAL_PROJECTS_LIMITS_ENABLED) {
      return err(
        new PersonalProjectsLimitedError({
          message: "Projects can't be created outside of workspaces"
        })
      )
    }

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    return ok()
  }
