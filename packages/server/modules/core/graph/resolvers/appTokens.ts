import { db } from '@/db/knex'
import { getTokenAppInfoFactory } from '@/modules/auth/repositories/apps'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { canCreateAppToken, isValidScope } from '@/modules/core/helpers/token'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { createAppTokenFactory } from '@/modules/core/services/tokens'

const getTokenAppInfo = getTokenAppInfoFactory({ db })
const createAppToken = createAppTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
})

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

      const scopes = args.token.scopes.filter(isValidScope)
      const token = await createAppToken({
        ...args.token,
        userId: ctx.userId!,
        appId,
        lifespan: args.token.lifespan || undefined,
        scopes
      })
      return token
    }
  }
} as Resolvers
