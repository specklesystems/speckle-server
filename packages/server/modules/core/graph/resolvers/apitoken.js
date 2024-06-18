'use strict'

const { ForbiddenError } = require('apollo-server-express')
const {
  createPersonalAccessToken,
  revokeToken,
  getUserTokens
} = require('../../services/tokens')
const { canCreatePAT } = require('@/modules/core/helpers/token')

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
const resolvers = {
  Query: {},
  User: {
    async apiTokens(parent, args, context) {
      // TODO!
      if (parent.id !== context.userId)
        throw new ForbiddenError('You can only view your own tokens')

      const tokens = await getUserTokens(context.userId)
      return tokens || []
    }
  },
  Mutation: {
    async apiTokenCreate(parent, args, context) {
      canCreatePAT({
        scopes: {
          user: context.scopes || [],
          token: args.token.scopes
        }
      })

      return await createPersonalAccessToken(
        context.userId,
        args.token.name,
        args.token.scopes,
        args.token.lifespan
      )
    },
    async apiTokenRevoke(parent, args, context) {
      let id = null
      if (args.token.toLowerCase().includes('bearer')) id = args.token.split(' ')[1]
      else id = args.token
      await revokeToken(id, context.userId) // let's not revoke other people's tokens
      return true
    }
  }
}

module.exports = resolvers
