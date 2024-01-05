import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { canCreateAppToken } from '@/modules/core/helpers/token'
import { getTokenAppInfo } from '@/modules/core/repositories/tokens'
import { createAppToken } from '@/modules/core/services/tokens'

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
      const appId = ctx.appId || ''
      canCreateAppToken({
        strict: true,
        userScopes: ctx.scopes || [],
        tokenScopes: args.token.scopes,
        userAppId: appId,
        tokenAppId: appId
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
