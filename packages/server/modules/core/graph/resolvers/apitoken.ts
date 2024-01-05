'use strict'

import { ForbiddenError } from 'apollo-server-express'
import {
  createPersonalAccessToken,
  revokeToken,
  getUserTokens
} from '@/modules/core/services/tokens'
import { canCreatePAT } from '@/modules/core/helpers/token'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  Query: {},
  User: {
    async apiTokens(parent, _args, context) {
      // TODO!
      if (parent.id !== context.userId)
        throw new ForbiddenError('You can only view your own tokens')

      const tokens = await getUserTokens(context.userId)
      return tokens
    }
  },
  Mutation: {
    async apiTokenCreate(_parent, args, context) {
      canCreatePAT({
        userScopes: context.scopes || [],
        tokenScopes: args.token.scopes,
        strict: true
      })

      return await createPersonalAccessToken(
        context.userId!,
        args.token.name,
        args.token.scopes,
        args.token.lifespan
      )
    },
    async apiTokenRevoke(_parent, args, context) {
      let id = null
      if (args.token.toLowerCase().includes('bearer')) {
        id = args.token.split(' ')[1]
      } else {
        id = args.token
      }
      await revokeToken(id, context.userId!) // let's not revoke other people's tokens
      return true
    }
  }
} as Resolvers
