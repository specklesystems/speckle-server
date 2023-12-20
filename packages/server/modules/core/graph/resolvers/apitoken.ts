'use strict'

import { ForbiddenError } from 'apollo-server-express'
import {
  createPersonalAccessToken,
  revokeToken,
  getUserTokens,
  TokenRequestParams
} from '@/modules/core/services/tokens'
import { canCreatePAT } from '@/modules/core/helpers/token'

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
export default {
  Query: {},
  User: {
    async apiTokens(
      parent: { id: string },
      args: unknown,
      context: { userId: string }
    ) {
      // TODO!
      if (parent.id !== context.userId)
        throw new ForbiddenError('You can only view your own tokens')

      const tokens = await getUserTokens(context.userId)
      return tokens
    }
  },
  Mutation: {
    async apiTokenCreate(
      parent: unknown,
      args: { token: TokenRequestParams },
      context: { userId: string; scopes: string[] }
    ) {
      canCreatePAT({
        userScopes: context.scopes || [],
        tokenScopes: args.token.scopes,
        strict: true
      })

      return await createPersonalAccessToken(
        context.userId,
        args.token.name,
        args.token.scopes,
        args.token.lifespan
      )
    },
    async apiTokenRevoke(
      parent: unknown,
      args: { token: string },
      context: { userId: string }
    ) {
      let id = null
      if (args.token.toLowerCase().includes('bearer')) id = args.token.split(' ')[1]
      else id = args.token
      await revokeToken(id, context.userId) // let's not revoke other people's tokens
      return true
    }
  }
}
