'use strict'

import { AuthContext } from '@/modules/shared/authz'
import { ForbiddenError } from 'apollo-server-express'
import {
  createPersonalAccessToken,
  revokeToken,
  getUserTokens
} from '@/modules/core/services/tokens'
import { canCreatePAT } from '@/modules/core/helpers/token'
import type {
  RequireFields,
  MutationApiTokenCreateArgs,
  Resolvers
} from '@/modules/core/graph/generated/graphql'

export = {
  Query: {},
  User: {
    async apiTokens(parent: { id: string }, _args: unknown, context: AuthContext) {
      // TODO!
      if (parent.id !== context.userId)
        throw new ForbiddenError('You can only view your own tokens')

      const tokens = await getUserTokens(context.userId)
      return tokens
    }
  },
  Mutation: {
    async apiTokenCreate(
      _parent: unknown,
      args: RequireFields<MutationApiTokenCreateArgs, 'token'>,
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
      _parent: unknown,
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
} as Resolvers
