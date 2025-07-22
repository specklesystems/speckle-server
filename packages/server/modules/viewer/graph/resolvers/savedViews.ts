import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import {
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommitsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import { getViewerResourceGroupsFactory } from '@/modules/core/services/commit/viewerResources'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import {
  getStoredViewCountFactory,
  storeSavedViewFactory
} from '@/modules/viewer/repositories/savedViews'
import { createSavedViewFactory } from '@/modules/viewer/services/savedViewsManagement'

const resolvers: Resolvers = {
  ProjectMutations: {
    savedViewMutations: () => ({})
  },
  SavedViewMutations: {
    createView: async (_parent, args, ctx) => {
      const projectId = args.input.projectId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canCreate = await ctx.authPolicies.project.savedViews.canCreate({
        userId: ctx.userId,
        projectId
      })
      throwIfAuthNotOk(canCreate)

      const projectDb = await getProjectDbClient({ projectId })
      const createSavedView = createSavedViewFactory({
        getViewerResourceGroups: getViewerResourceGroupsFactory({
          // TODO: Dataloaders?
          getStreamObjects: getStreamObjectsFactory({ db: projectDb }),
          getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDb }),
          getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDb }),
          getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDb }),
          getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDb })
        }),
        getStoredViewCount: getStoredViewCountFactory({ db: projectDb }),
        storeSavedView: storeSavedViewFactory({ db: projectDb })
      })
      return await createSavedView({ input: args.input, authorId: ctx.userId! })
    }
  }
}
export default resolvers
