import { db } from '@/db/knex'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapGqlToDbSortDirection } from '@/modules/core/helpers/project'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
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
import { LogicError, NotFoundError } from '@/modules/shared/errors'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { buildDefaultGroupId } from '@/modules/viewer/helpers/savedViews'
import {
  getGroupSavedViewsPageItemsFactory,
  getGroupSavedViewsTotalCountFactory,
  getProjectSavedViewGroupsPageItemsFactory,
  getProjectSavedViewGroupsTotalCountFactory,
  getSavedViewGroupFactory,
  getStoredViewCountFactory,
  getUngroupedSavedViewsGroupFactory,
  recalculateGroupResourceIdsFactory,
  storeSavedViewFactory,
  storeSavedViewGroupFactory
} from '@/modules/viewer/repositories/savedViews'
import {
  createSavedViewFactory,
  createSavedViewGroupFactory,
  getGroupSavedViewsFactory,
  getProjectSavedViewGroupsFactory
} from '@/modules/viewer/services/savedViewsManagement'
import { getViewerResourceGroupsFactory } from '@/modules/viewer/services/viewerResources'
import { Authz } from '@speckle/shared'
import { parseResourceFromString, resourceBuilder } from '@speckle/shared/viewer/route'
import { formatSerializedViewerState } from '@speckle/shared/viewer/state'
import type { Knex } from 'knex'
import { ungroupedScenesGroupTitle } from '@speckle/shared/saved-views'

const buildGetViewerResourceGroups = (params: { projectDb: Knex }) => {
  const { projectDb } = params
  return getViewerResourceGroupsFactory({
    getStreamObjects: getStreamObjectsFactory({ db: projectDb }),
    getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDb }),
    getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDb }),
    getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDb }),
    getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDb }),
    getBranchesByIds: getBranchesByIdsFactory({ db: projectDb })
  })
}

const resolvers: Resolvers = {
  Project: {
    async savedViewGroups(parent, args, ctx) {
      const { input } = args

      const getProjectSavedViewGroups = getProjectSavedViewGroupsFactory({
        getProjectSavedViewGroupsPageItems: getProjectSavedViewGroupsPageItemsFactory({
          db
        }),
        getProjectSavedViewGroupsTotalCount: getProjectSavedViewGroupsTotalCountFactory(
          { db }
        )
      })

      return await getProjectSavedViewGroups({
        projectId: parent.id,
        resourceIdString: input.resourceIdString,
        userId: ctx.userId,
        onlyAuthored: input.onlyAuthored,
        search: input.search,
        limit: input.limit,
        cursor: input.cursor
      })
    },
    async savedViewGroup(parent, args, ctx) {
      const projectDb = await getProjectDbClient({ projectId: parent.id })
      const group = await ctx.loaders
        .forRegion({ db: projectDb })
        .savedViews.getSavedViewGroup.load({
          groupId: args.id,
          projectId: parent.id
        })
      if (!group) {
        throw new NotFoundError(
          `Saved view group with ID ${args.id} not found in project ${parent.id}`
        )
      }

      return group
    },
    ungroupedViewGroup: async (parent, args) => {
      const getDefaultGroup = getUngroupedSavedViewsGroupFactory()
      const group = getDefaultGroup({
        projectId: parent.id,
        resourceIdString: args.input.resourceIdString
      })

      return group
    }
  },
  SavedView: {
    async author(parent, _args, ctx) {
      return parent.authorId
        ? await ctx.loaders.users.getUser.load(parent.authorId)
        : null
    },
    resourceIdString(parent) {
      const resourceIds = parent.resourceIds
      return resourceBuilder().addFromString(resourceIds.join(',')).toString()
    },
    viewerState(parent) {
      return formatSerializedViewerState(parent.viewerState.state)
    },
    group: async (parent, _args, ctx) => {
      const groupId =
        parent.groupId ||
        buildDefaultGroupId({
          resourceIds: parent.resourceIds,
          projectId: parent.projectId
        })
      const projectDb = await getProjectDbClient({ projectId: parent.projectId })
      const group = await ctx.loaders
        .forRegion({ db: projectDb })
        .savedViews.getSavedViewGroup.load({
          groupId,
          projectId: parent.projectId
        })
      if (!group) {
        throw new LogicError('Unexpectedly could not resolve a view group')
      }

      return group
    }
  },
  SavedViewGroup: {
    title: (parent) => parent.name || ungroupedScenesGroupTitle,
    isUngroupedViewsGroup: (parent) => parent.name === null,
    groupId: (parent) => (parent.name ? parent.id : null),
    async views(parent, args, ctx) {
      const { input } = args
      const getGroupSavedViews = getGroupSavedViewsFactory({
        getGroupSavedViewsPageItems: getGroupSavedViewsPageItemsFactory({ db }),
        getGroupSavedViewsTotalCount: getGroupSavedViewsTotalCountFactory({ db })
      })

      const allowedSortBy = <const>['createdAt', 'name', 'updatedAt']
      const sortBy = input.sortBy
        ? allowedSortBy.find((s) => s === input.sortBy)
        : undefined

      return await getGroupSavedViews({
        projectId: parent.projectId,
        groupResourceIdString: resourceBuilder()
          .addResources(parent.resourceIds.map(parseResourceFromString))
          .toString(),
        userId: ctx.userId,
        groupId: parent.name ? parent.id : null,
        onlyAuthored: input.onlyAuthored,
        search: input.search,
        limit: input.limit,
        cursor: input.cursor,
        sortDirection: input.sortDirection
          ? mapGqlToDbSortDirection(input.sortDirection)
          : undefined,
        sortBy
      })
    }
  },
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
        getViewerResourceGroups: buildGetViewerResourceGroups({ projectDb }),
        getStoredViewCount: getStoredViewCountFactory({ db: projectDb }),
        storeSavedView: storeSavedViewFactory({ db: projectDb }),
        getSavedViewGroup: getSavedViewGroupFactory({ db: projectDb }),
        recalculateGroupResourceIds: recalculateGroupResourceIdsFactory({
          db: projectDb
        })
      })
      return await createSavedView({ input: args.input, authorId: ctx.userId! })
    },
    createGroup: async (_parent, args, ctx) => {
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
      const createSavedViewGroup = createSavedViewGroupFactory({
        storeSavedViewGroup: storeSavedViewGroupFactory({ db: projectDb }),
        getViewerResourceGroups: buildGetViewerResourceGroups({ projectDb })
      })
      return await createSavedViewGroup({
        input: args.input,
        authorId: ctx.userId!
      })
    }
  },
  ProjectPermissionChecks: {
    canCreateSavedView: async (parent, _args, ctx) => {
      const projectId = parent.projectId
      const canCreate = await ctx.authPolicies.project.savedViews.canCreate({
        userId: ctx.userId,
        projectId
      })
      return Authz.toGraphqlResult(canCreate)
    }
  }
}
export default resolvers
