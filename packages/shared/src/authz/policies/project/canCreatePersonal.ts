import { err, ok } from 'true-myth/result'
import { MaybeUserContext } from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy, ErrorsOf, LoadersOf } from '../../domain/policies.js'
import { Roles } from '../../../core/constants.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'

export const canCreatePersonalProjectPolicy: AuthPolicy<
  LoadersOf<typeof ensureMinimumServerRoleFragment> | typeof Loaders.getEnv,
  MaybeUserContext,
  ErrorsOf<typeof ensureMinimumServerRoleFragment>
> =
  (loaders) =>
  async ({ userId }) => {
    const env = await loaders.getEnv()
    if (env.FF_WORKSPACES_MODULE_ENABLED) {
      // TODO: We're not ready to enforce this yet, there's a bunch of tests that would break
      // return err(
      //   new ProjectNoAccessError({
      //     message: "Projects can't be created outside of workspaces"
      //   })
      // )
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
