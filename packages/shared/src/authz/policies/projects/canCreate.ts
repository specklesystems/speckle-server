import { err, ok } from 'true-myth/result'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerPersonalProjectsDisabledError
} from '../../domain/authErrors.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy, MaybeUserContext } from '../../domain/policies.js'
import { hasMinimumServerRole } from '../../checks/serverRole.js'
import { Roles } from '../../../core/constants.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole

type PolicyArgs = MaybeUserContext

type PolicyErrors =
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
  | InstanceType<typeof ServerPersonalProjectsDisabledError>

export const canCreateProjectPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId }) => {
    const env = await loaders.getEnv()

    // New projects are required to be in workspaces when the new plans are enabled.
    if (env.FF_WORKSPACES_MODULE_ENABLED) {
      if (env.FF_WORKSPACES_NEW_PLANS_ENABLED) {
        return err(new ServerPersonalProjectsDisabledError())
      }
    }

    // Users must have a non-guest server role to create projects.
    if (!userId) return err(new ServerNoSessionError())
    const isActiveServerUser = await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (!isActiveServerUser) return err(new ServerNoAccessError())

    return ok()
  }
