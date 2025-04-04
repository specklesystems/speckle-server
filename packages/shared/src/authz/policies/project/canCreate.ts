import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { MaybeUserContext } from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { hasMinimumServerRole } from '../../checks/serverRole.js'
import { Roles } from '../../../core/constants.js'

export const canCreateProjectPolicy: AuthPolicy<
  typeof Loaders.getServerRole | typeof Loaders.getEnv,
  MaybeUserContext,
  InstanceType<
    | typeof ServerNoSessionError
    | typeof ServerNoAccessError
    | typeof ProjectNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
  >
> =
  (loaders) =>
  async ({ userId }) => {
    const env = await loaders.getEnv()
    if (!userId?.length) return err(new ServerNoSessionError())
    if (env.FF_WORKSPACES_MODULE_ENABLED) {
      return err(
        new ProjectNoAccessError({
          message: "Projects can't be created outside of workspaces"
        })
      )
    }

    const isActiveServerUser = await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (!isActiveServerUser) return err(new ServerNoAccessError())
    return ok()
  }
