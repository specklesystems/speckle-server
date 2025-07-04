import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import {
  listProjectEmbedTokensFactory,
  revokeEmbedTokenByIdFactory,
  revokeProjectEmbedTokensFactory,
  storeEmbedApiTokenFactory
} from '@/modules/core/repositories/embedTokens'
import {
  createEmbedTokenFactory,
  createTokenFactory
} from '@/modules/core/services/tokens'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import { getUserFactory } from '@/modules/core/repositories/users'

const resolvers: Resolvers = {
  EmbedToken: {
    user: async (parent) => {
      return await getUserFactory({ db })(parent.userId)
    }
  },
  Project: {
    embedTokens: async (parent, _args, context) => {
      const canReadEmbedTokens = await context.authPolicies.project.canReadEmbedTokens({
        userId: context.userId,
        projectId: parent.id
      })
      throwIfAuthNotOk(canReadEmbedTokens)

      return await listProjectEmbedTokensFactory({ db })({
        projectId: parent.id
      })
    }
  },
  ProjectMutations: {
    createEmbedToken: async (_parent, args, context) => {
      const canCreateEmbedToken =
        await context.authPolicies.project.canUpdateEmbedTokens({
          userId: context.userId,
          projectId: args.token.projectId
        })
      throwIfAuthNotOk(canCreateEmbedToken)

      return await createEmbedTokenFactory({
        createToken: createTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({ db })
        }),
        storeEmbedToken: storeEmbedApiTokenFactory({ db })
      })({
        ...removeNullOrUndefinedKeys(args.token),
        userId: context.userId!
      })
    },
    revokeEmbedToken: async (_parent, args, context) => {
      const canRevokeEmbedToken =
        await context.authPolicies.project.canUpdateEmbedTokens({
          userId: context.userId,
          projectId: args.projectId
        })
      throwIfAuthNotOk(canRevokeEmbedToken)

      return await revokeEmbedTokenByIdFactory({ db })({
        tokenId: args.token,
        projectId: args.projectId
      })
    },
    revokeEmbedTokens: async (_parent, args, context) => {
      const canRevokeEmbedTokens =
        await context.authPolicies.project.canUpdateEmbedTokens({
          userId: context.userId,
          projectId: args.projectId
        })
      throwIfAuthNotOk(canRevokeEmbedTokens)

      await revokeProjectEmbedTokensFactory({ db })({ projectId: args.projectId })

      return true
    }
  }
}

export default resolvers
