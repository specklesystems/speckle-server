import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { canCreateAppToken } from '@/modules/core/helpers/token'
import { getTokenAppInfo } from '@/modules/core/repositories/tokens'
import { createAppToken } from '@/modules/core/services/tokens'

/**
 * RESOURCE ACCESS CHECKING:
 *
 * GQL:
 * 1. Scopes - if project scope used, also check resource access rules (also - if ask for all projects, filter out the ones that are not allowed)
 * 2. Project rights (any directives to check?) - not only check access to project (authorizeResolver?), but also check access rules
 * 3. Some resolvers have custom checks, no directives - check manually
 *
 * REST:
 * ???
 *
 * - [X] Validate rules before insert? THat way we can rely on them being correct?
 * - - Not really, user can change roles after token creation
 *
 * - [X] What if rules exist, but only for projects? We still want to treat other types as unlimited
 */

export = {
  Query: {
    async authenticatedAsApp(_parent, _args, ctx) {
      const { appId, token } = ctx
      if (!appId || !token) return null

      return (await getTokenAppInfo({ appId, token })) || null
    }
  },
  Mutation: {
    async appTokenCreate(_parent, args, ctx) {
      const appId = ctx.appId || '' // validation that this is a valid app id is done in canCreateAppToken

      canCreateAppToken({
        scopes: {
          user: ctx.scopes || [],
          token: args.token.scopes
        },
        // both app ids are the same in this scenario, since there's no way to specify a different token app id
        appId: {
          user: appId,
          token: appId
        },
        limitedResources: {
          token: args.token.limitResources,
          user: ctx.resourceAccessRules
        }
      })

      const token = await createAppToken({
        ...args.token,
        userId: ctx.userId!,
        appId,
        lifespan: args.token.lifespan || undefined
      })
      return token
    }
  }
} as Resolvers
