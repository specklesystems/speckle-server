import { db } from '@/db/knex'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import {
  getApiTokenByIdFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import { createTokenFactory } from '@/modules/core/services/tokens'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { getSavedViewGroupFactory } from '@/modules/viewer/repositories/dataLoaders/savedViews'
import { storeSavedViewGroupApiTokenFactory } from '@/modules/viewer/repositories/tokens'
import { createSavedViewGroupTokenFactory } from '@/modules/viewer/services/tokens'
import type { Resolvers } from '@apollo/client/core'

const resolvers: Resolvers = {
  ProjectMutations: {
    savedViewMutations: () => ({})
  },
  SavedViewMutations: {
    createToken: async (_parent, args, ctx) => {
      const projectId = args.input.projectId
      const userId = ctx.userId!
      const savedViewGroupId = args.input.groupId

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canCreate = await ctx.authPolicies.project.savedViews.canCreate({
        userId,
        projectId
      })
      throwIfAuthNotOk(canCreate)

      return await createSavedViewGroupTokenFactory({
        getSavedViewGroup: getSavedViewGroupFactory({ loaders: ctx.loaders }),
        createToken: createTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({ db })
        }),
        getToken: getApiTokenByIdFactory({ db }),
        storeSavedViewGroupApiToken: storeSavedViewGroupApiTokenFactory({ db })
      })({
        savedViewGroupId,
        projectId,
        userId
      })
    }
  }
}

export default resolvers // TODO: ff
