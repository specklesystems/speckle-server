import { ForbiddenError } from '@/modules/shared/errors'
import { canCreatePAT, isValidScope } from '@/modules/core/helpers/token'
import { db } from '@/db/knex'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storePersonalApiTokenFactory,
  getUserPersonalAccessTokensFactory,
  revokeUserTokenByIdFactory
} from '@/modules/core/repositories/tokens'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import { withOperationLogging } from '@/observability/domain/businessLogging'

const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})
const getUserTokens = getUserPersonalAccessTokensFactory({ db })
const revokeToken = revokeUserTokenByIdFactory({ db })

const resolvers = {
  Query: {},
  User: {
    async apiTokens(parent, _args, context) {
      // TODO!
      if (parent.id !== context.userId)
        throw new ForbiddenError('You can only view your own tokens')

      const tokens = await getUserTokens(context.userId)
      return tokens || []
    }
  },
  Mutation: {
    async apiTokenCreate(_parent, args, context) {
      canCreatePAT({
        scopes: {
          user: context.scopes || [],
          token: args.token.scopes
        }
      })

      return await withOperationLogging(
        async () =>
          await createPersonalAccessToken(
            context.userId!,
            args.token.name,
            args.token.scopes.filter(isValidScope),
            args.token.lifespan || undefined,
            args.token.limitResources || null
          ),
        {
          logger: context.log,
          operationName: 'createPersonalAccessToken',
          operationDescription: `Create a new Personal Access Token`
        }
      )
    },
    async apiTokenRevoke(_parent, args, context) {
      let id = null
      if (args.token.toLowerCase().includes('bearer')) id = args.token.split(' ')[1]
      else id = args.token
      await withOperationLogging(
        async () => await revokeToken(id, context.userId!), // let's not revoke other people's tokens
        {
          logger: context.log,
          operationName: 'revokePersonalAccessToken',
          operationDescription: `Revoke a Personal Access Token`
        }
      )
      return true
    }
  }
} as Resolvers

export default resolvers
