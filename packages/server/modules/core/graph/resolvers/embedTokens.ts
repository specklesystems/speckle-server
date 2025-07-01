import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  storeApiTokenFactory,
  storeEmbedApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import {
  createEmbedTokenFactory,
  createTokenFactory
} from '@/modules/core/services/tokens'
import { removeNullOrUndefinedKeys } from '@speckle/shared'

export = {
  ProjectMutations: {
    createEmbedToken: async (_parent, args, context) => {
      // TODO: Policy

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
    }
  }
} as Resolvers
