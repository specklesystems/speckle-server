import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getBranchesByIdsFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommitsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getSavedViewFactory } from '@/modules/viewer/repositories/dataLoaders/savedViews'
import { getViewerResourceGroupsFactory } from '@/modules/viewer/services/viewerResources'

const resolvers: Resolvers = {
  Project: {
    async viewerResources(parent, { resourceIdString, loadedVersionsOnly }, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const getStreamObjects = getStreamObjectsFactory({ db: projectDB })
      const getViewerResourceGroups = getViewerResourceGroupsFactory({
        getStreamObjects,
        getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDB }),
        getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDB }),
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDB }),
        getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDB }),
        getBranchesByIds: getBranchesByIdsFactory({ db: projectDB }),
        getSavedView: getSavedViewFactory({ loaders: ctx.loaders })
      })

      return await getViewerResourceGroups({
        projectId: parent.id,
        resourceIdString,
        loadedVersionsOnly
      })
    }
  }
}

export default resolvers
