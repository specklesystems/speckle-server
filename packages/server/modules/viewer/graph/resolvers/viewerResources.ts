import type {
  ProjectViewerResourcesExtendedArgs,
  Resolvers
} from '@/modules/core/graph/generated/graphql'
import type { ProjectGraphQLReturn } from '@/modules/core/helpers/graphTypes'
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
import type { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import {
  getModelHomeSavedViewFactory,
  getSavedViewFactory
} from '@/modules/viewer/repositories/dataLoaders/savedViews'
import { getViewerResourceGroupsFactory } from '@/modules/viewer/services/viewerResources'
import { isErr } from 'true-myth/result'

const extendedViewerResourcesResolver = async (
  parent: ProjectGraphQLReturn,
  args: ProjectViewerResourcesExtendedArgs,
  ctx: GraphQLContext
) => {
  const projectId = parent.id
  const projectDB = await getProjectDbClient({ projectId })

  const { resourceIdString, loadedVersionsOnly, savedViewSettings } = args
  let savedViewId = args.savedViewId

  // If savedViewId set, check for access
  if (savedViewId) {
    const canRead = await ctx.authPolicies.project.savedViews.canRead({
      userId: ctx.userId,
      projectId,
      savedViewId
    })
    if (isErr(canRead)) {
      // we dont want to throw here, just act as if no view id set, otherwise the entire viewer fails
      // to load because of a broken view id
      savedViewId = null
    }
  }

  // TODO: Home view gets implicitly resolved inside the service, in the future
  // when we have model-level access checks we'll need to validate access for that

  const getStreamObjects = getStreamObjectsFactory({ db: projectDB })
  const getViewerResourceGroups = getViewerResourceGroupsFactory({
    getStreamObjects,
    getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDB }),
    getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDB }),
    getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDB }),
    getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDB }),
    getBranchesByIds: getBranchesByIdsFactory({ db: projectDB }),
    getSavedView: getSavedViewFactory({ loaders: ctx.loaders }),
    getModelHomeSavedView: getModelHomeSavedViewFactory({ loaders: ctx.loaders })
  })

  return {
    ...(await getViewerResourceGroups({
      projectId: parent.id,
      resourceIdString,
      loadedVersionsOnly,
      savedViewId,
      savedViewSettings,
      applyHomeView: true
    })),
    request: { savedViewId: args.savedViewId }
  }
}

const resolvers: Resolvers = {
  Project: {
    async viewerResources(parent, args, ctx) {
      return (await extendedViewerResourcesResolver(parent, args, ctx)).groups
    },
    async viewerResourcesExtended(parent, args, ctx) {
      return await extendedViewerResourcesResolver(parent, args, ctx)
    }
  }
}

export default resolvers
