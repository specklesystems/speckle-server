import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getApiTokenByIdFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import {
  countProjectEmbedTokensFactory,
  listProjectEmbedTokensFactory,
  revokeEmbedTokenByIdFactory,
  revokeProjectEmbedTokensFactory,
  storeEmbedApiTokenFactory
} from '@/modules/core/repositories/embedTokens'
import {
  createEmbedTokenFactory,
  createTokenFactory,
  getPaginatedProjectEmbedTokensFactory
} from '@/modules/core/services/tokens'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import { getUserFactory } from '@/modules/core/repositories/users'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'

const resolvers: Resolvers = {
  EmbedToken: {
    user: async (parent) => {
      return await getUserFactory({ db })(parent.userId)
    }
  },
  Project: {
    embedTokens: async (parent, args, context) => {
      const canReadEmbedTokens = await context.authPolicies.project.canReadEmbedTokens({
        userId: context.userId,
        projectId: parent.id
      })
      throwIfAuthNotOk(canReadEmbedTokens)

      return await getPaginatedProjectEmbedTokensFactory({
        listEmbedTokens: listProjectEmbedTokensFactory({ db }),
        countEmbedTokens: countProjectEmbedTokensFactory({ db })
      })({
        projectId: parent.id,
        filter: removeNullOrUndefinedKeys(args)
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
      throwIfResourceAccessNotAllowed({
        resourceId: args.token.projectId,
        resourceType: 'project',
        resourceAccessRules: context.resourceAccessRules
      })

      return await createEmbedTokenFactory({
        createToken: createTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({ db })
        }),
        getToken: getApiTokenByIdFactory({ db }),
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
      throwIfResourceAccessNotAllowed({
        resourceId: args.projectId,
        resourceType: 'project',
        resourceAccessRules: context.resourceAccessRules
      })

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
      throwIfResourceAccessNotAllowed({
        resourceId: args.projectId,
        resourceType: 'project',
        resourceAccessRules: context.resourceAccessRules
      })

      await revokeProjectEmbedTokensFactory({ db })({ projectId: args.projectId })

      return true
    }
  }
}

export default resolvers
