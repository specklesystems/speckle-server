'use strict'

import { AuthContext } from '@/modules/shared/authz'
import { ForbiddenError } from 'apollo-server-express'
import {
  createPersonalAccessToken,
  revokeToken,
  getUserTokens,
  TokenRequestParams
} from '@/modules/core/services/tokens'
import { canCreatePAT } from '@/modules/core/helpers/token'

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
export = {
  Query: {},
  User: {
    async apiTokens(parent: { id: string }, args: unknown, context: AuthContext) {
      // TODO!
      if (parent.id !== context.userId)
        throw new ForbiddenError('You can only view your own tokens')

      const tokens = await getUserTokens(context.userId)
      return tokens
    }
  },
  Mutation: {
    async apiTokenCreate(
      parent: never,
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
      context: AuthContext
    ) {
      if (!context.userId) throw new Error('Invalid user id')
      let id = null
      if (args.token.toLowerCase().includes('bearer')) {
        id = args.token.split(' ')[1]
      } else {
        id = args.token
      }
      await revokeToken(id, context.userId) // let's not revoke other people's tokens
      return true
    }
  }
}
