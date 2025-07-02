import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  listProjectEmbedTokensFactory,
  revokeEmbedTokenByIdFactory,
  storeApiTokenFactory,
  storeEmbedApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import {
  createEmbedTokenFactory,
  createTokenFactory
} from '@/modules/core/services/tokens'
import { mapAuthToServerError } from '@/modules/shared/helpers/errorHelper'
import { removeNullOrUndefinedKeys } from '@speckle/shared'

export = {
  Project: {
    embedTokens: async (parent, _args, context) => {
      const canReadEmbedTokens =
        await context.authPolicies.project.tokens.canReadEmbedTokens({
          userId: context.userId,
          projectId: parent.id
        })
      if (!canReadEmbedTokens.isOk) {
        throw mapAuthToServerError(canReadEmbedTokens.error)
      }

      return await listProjectEmbedTokensFactory({ db })({
        projectId: parent.id
      })
    }
  },
  ProjectMutations: {
    createEmbedToken: async (_parent, args, context) => {
      const canCreateEmbedToken =
        await context.authPolicies.project.tokens.canCreateEmbedToken({
          userId: context.userId,
          projectId: args.token.projectId
        })
      if (!canCreateEmbedToken.isOk) {
        throw mapAuthToServerError(canCreateEmbedToken.error)
      }

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
        await context.authPolicies.project.tokens.canRevokeEmbedToken({
          userId: context.userId,
          projectId: args.projectId
        })
      if (!canRevokeEmbedToken.isOk) {
        throw mapAuthToServerError(canRevokeEmbedToken.error)
      }

      return await revokeEmbedTokenByIdFactory({ db })({
        tokenId: args.token,
        projectId: args.projectId
      })
    }
  }
} as Resolvers
