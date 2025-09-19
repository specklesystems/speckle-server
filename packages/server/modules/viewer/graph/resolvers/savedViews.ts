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
import { LogicError, NotFoundError, NotImplementedError } from '@/modules/shared/errors'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { buildDefaultGroupId } from '@/modules/viewer/helpers/savedViews'
import {
  deleteSavedViewGroupRecordFactory,
  deleteSavedViewRecordFactory,
  getGroupSavedViewsPageItemsFactory,
  getGroupSavedViewsTotalCountFactory,
  getNewViewSpecificPositionFactory,
  getProjectSavedViewGroupsPageItemsFactory,
  getProjectSavedViewGroupsTotalCountFactory,
  getStoredViewCountFactory,
  getStoredViewGroupCountFactory,
  getUngroupedSavedViewsGroupFactory,
  rebalancingViewPositionsFactory,
  recalculateGroupResourceIdsFactory,
  setNewHomeViewFactory,
  storeSavedViewFactory,
  storeSavedViewGroupFactory,
  updateSavedViewGroupRecordFactory,
  updateSavedViewRecordFactory
} from '@/modules/viewer/repositories/savedViews'
import {
  createSavedViewFactory,
  createSavedViewGroupFactory,
  deleteSavedViewFactory,
  deleteSavedViewGroupFactory,
  getGroupSavedViewsFactory,
  getProjectSavedViewGroupsFactory,
  updateSavedViewFactory,
  updateSavedViewGroupFactory
} from '@/modules/viewer/services/savedViewsManagement'
import { getViewerResourceGroupsFactory } from '@/modules/viewer/services/viewerResources'
import { Authz } from '@speckle/shared'
import { parseResourceFromString, resourceBuilder } from '@speckle/shared/viewer/route'
import { formatSerializedViewerState } from '@speckle/shared/viewer/state'
import type { Knex } from 'knex'
import { ungroupedScenesGroupTitle } from '@speckle/shared/saved-views'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  getModelHomeSavedViewFactory,
  getSavedViewFactory,
  getSavedViewGroupFactory
} from '@/modules/viewer/repositories/dataLoaders/savedViews'
import type { RequestDataLoaders } from '@/modules/core/loaders'
import { omit } from 'lodash-es'

const buildGetViewerResourceGroups = (params: {
  projectDb: Knex
  loaders: RequestDataLoaders
}) => {
  const { projectDb } = params
  return getViewerResourceGroupsFactory({
    getStreamObjects: getStreamObjectsFactory({ db: projectDb }),
    getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDb }),
    getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDb }),
    getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDb }),
    getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDb }),
    getBranchesByIds: getBranchesByIdsFactory({ db: projectDb }),
    getSavedView: getSavedViewFactory({ loaders: params.loaders }),
    getModelHomeSavedView: getModelHomeSavedViewFactory({ loaders: params.loaders })
  })
}

const resolvers: Resolvers = {
  Project: {
    async savedViewGroups(parent, args, ctx) {
      const { input } = args

      const projectDb = await getProjectDbClient({ projectId: parent.id })
      const getProjectSavedViewGroups = getProjectSavedViewGroupsFactory({
        getProjectSavedViewGroupsPageItems: getProjectSavedViewGroupsPageItemsFactory({
          db: projectDb
        }),
        getProjectSavedViewGroupsTotalCount: getProjectSavedViewGroupsTotalCountFactory(
          { db: projectDb }
        )
      })

      return await getProjectSavedViewGroups({
        projectId: parent.id,
        resourceIdString: input.resourceIdString,
        userId: ctx.userId,
        onlyAuthored: input.onlyAuthored,
        onlyVisibility: input.onlyVisibility,
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
    },
    savedView: async (parent, args, ctx) => {
      const projectId = parent.id
      const canRead = await ctx.authPolicies.project.savedViews.canRead({
        userId: ctx.userId,
        projectId,
        savedViewId: args.id
      })
      throwIfAuthNotOk(canRead)

      const projectDb = await getProjectDbClient({ projectId })
      const view = await ctx.loaders
        .forRegion({ db: projectDb })
        .savedViews.getSavedView.load({
          viewId: args.id,
          projectId
        })
      if (!view) {
        throw new NotFoundError(
          `Saved view with ID ${args.id} not found in project ${parent.id}`
        )
      }

      return view
    },
    savedViewIfExists: async (parent, args, ctx) => {
      const projectId = parent.id
      if (!args.id?.length) return null

      const projectDb = await getProjectDbClient({ projectId })
      const view = await ctx.loaders
        .forRegion({ db: projectDb })
        .savedViews.getSavedView.load({
          viewId: args.id,
          projectId
        })

      if (view) {
        // Only access check if found
        const canRead = await ctx.authPolicies.project.savedViews.canRead({
          userId: ctx.userId,
          projectId,
          savedViewId: args.id
        })
        throwIfAuthNotOk(canRead)
      }

      return view
    }
  },
  Model: {
    homeView: async (parent, _args, ctx) => {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      return ctx.loaders
        .forRegion({ db: projectDb })
        .savedViews.getModelHomeSavedView.load({
          modelId: parent.id,
          projectId
        })
    },
    resourceIdString: async (parent, _args, ctx) => {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })
      const homeView = await ctx.loaders
        .forRegion({ db: projectDb })
        .savedViews.getModelHomeSavedView.load({
          modelId: parent.id,
          projectId
        })

      if (!homeView) return parent.id
      return resourceBuilder()
        .addResources(homeView.resourceIds)
        .clearVersions() // just use latest version
        .toString()
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
      const projectDb = await getProjectDbClient({ projectId: parent.projectId })
      const getGroupSavedViews = getGroupSavedViewsFactory({
        getGroupSavedViewsPageItems: getGroupSavedViewsPageItemsFactory({
          db: projectDb
        }),
        getGroupSavedViewsTotalCount: getGroupSavedViewsTotalCountFactory({
          db: projectDb
        })
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
        onlyVisibility: input.onlyVisibility,
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
        getViewerResourceGroups: buildGetViewerResourceGroups({
          projectDb,
          loaders: ctx.loaders
        }),
        getStoredViewCount: getStoredViewCountFactory({ db: projectDb }),
        storeSavedView: storeSavedViewFactory({ db: projectDb }),
        getSavedViewGroup: getSavedViewGroupFactory({ loaders: ctx.loaders }),
        recalculateGroupResourceIds: recalculateGroupResourceIdsFactory({
          db: projectDb
        }),
        setNewHomeView: setNewHomeViewFactory({
          db: projectDb
        }),
        getNewViewSpecificPosition: getNewViewSpecificPositionFactory({
          db: projectDb
        }),
        rebalanceViewPositions: rebalancingViewPositionsFactory({ db: projectDb })
      })
      return await createSavedView({ input: args.input, authorId: ctx.userId! })
    },
    deleteView: async (_parent, args, ctx) => {
      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canUpdate = await ctx.authPolicies.project.savedViews.canUpdate({
        userId: ctx.userId,
        projectId,
        savedViewId: args.input.id
      })
      throwIfAuthNotOk(canUpdate)

      await deleteSavedViewFactory({
        getSavedView: getSavedViewFactory({ loaders: ctx.loaders }),
        deleteSavedViewRecord: deleteSavedViewRecordFactory({
          db: projectDb
        }),
        recalculateGroupResourceIds: recalculateGroupResourceIdsFactory({
          db: projectDb
        })
      })({
        id: args.input.id,
        projectId,
        userId: ctx.userId!
      })

      return true
    },
    updateView: async (_parent, args, ctx) => {
      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const updates = omit(args.input, 'id', 'projectId')
      const isJustMove = Object.keys(updates).length === 1 && 'groupId' in updates
      if (isJustMove) {
        const canMove = await ctx.authPolicies.project.savedViews.canMove({
          userId: ctx.userId,
          projectId,
          savedViewId: args.input.id
        })
        throwIfAuthNotOk(canMove)
      } else {
        const canUpdate = await ctx.authPolicies.project.savedViews.canUpdate({
          userId: ctx.userId,
          projectId,
          savedViewId: args.input.id
        })
        throwIfAuthNotOk(canUpdate)
      }

      const updateSavedView = updateSavedViewFactory({
        getViewerResourceGroups: buildGetViewerResourceGroups({
          projectDb,
          loaders: ctx.loaders
        }),
        getSavedView: getSavedViewFactory({ loaders: ctx.loaders }),
        getSavedViewGroup: getSavedViewGroupFactory({ loaders: ctx.loaders }),
        updateSavedViewRecord: updateSavedViewRecordFactory({
          db: projectDb
        }),
        recalculateGroupResourceIds: recalculateGroupResourceIdsFactory({
          db: projectDb
        }),
        setNewHomeView: setNewHomeViewFactory({
          db: projectDb
        }),
        rebalanceViewPositions: rebalancingViewPositionsFactory({ db: projectDb }),
        getNewViewSpecificPosition: getNewViewSpecificPositionFactory({
          db: projectDb
        })
      })

      const updatedView = await updateSavedView({
        input: args.input,
        userId: ctx.userId!
      })

      // update loader cache
      ctx.loaders.forEachCachedRegion(({ loaders }) => {
        loaders.savedViews.getSavedView.clear({
          viewId: updatedView.id,
          projectId: updatedView.projectId
        })
        loaders.savedViews.getSavedView.prime(
          {
            viewId: updatedView.id,
            projectId: updatedView.projectId
          },
          updatedView
        )
      })

      return updatedView
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
        getViewerResourceGroups: buildGetViewerResourceGroups({
          projectDb,
          loaders: ctx.loaders
        }),
        getStoredViewGroupCount: getStoredViewGroupCountFactory({
          db: projectDb
        })
      })
      return await createSavedViewGroup({
        input: args.input,
        authorId: ctx.userId!
      })
    },
    deleteGroup: async (_parent, args, ctx) => {
      const projectId = args.input.projectId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canDelete = await ctx.authPolicies.project.savedViews.canUpdateGroup({
        userId: ctx.userId,
        projectId,
        savedViewGroupId: args.input.groupId
      })
      throwIfAuthNotOk(canDelete)

      const projectDb = await getProjectDbClient({ projectId })
      const deleteSavedViewGroup = deleteSavedViewGroupFactory({
        deleteSavedViewGroupRecord: deleteSavedViewGroupRecordFactory({
          db: projectDb
        })
      })

      await deleteSavedViewGroup({
        input: {
          groupId: args.input.groupId,
          projectId
        },
        userId: ctx.userId!
      })

      return true
    },
    updateGroup: async (_parent, args, ctx) => {
      const projectId = args.input.projectId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canUpdate = await ctx.authPolicies.project.savedViews.canUpdateGroup({
        userId: ctx.userId,
        projectId,
        savedViewGroupId: args.input.groupId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDb = await getProjectDbClient({ projectId })
      const updateSavedViewGroup = updateSavedViewGroupFactory({
        updateSavedViewGroupRecord: updateSavedViewGroupRecordFactory({
          db: projectDb
        }),
        getSavedViewGroup: getSavedViewGroupFactory({ loaders: ctx.loaders })
      })

      return await updateSavedViewGroup({
        input: args.input,
        userId: ctx.userId!
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

const disabledMessage = 'Saved views are disabled on this server'
const disabledResolvers: Resolvers = {
  Project: {
    savedViewGroups: () => {
      throw new NotImplementedError(disabledMessage)
    },
    savedViewGroup: () => {
      throw new NotImplementedError(disabledMessage)
    },
    ungroupedViewGroup: () => {
      throw new NotImplementedError(disabledMessage)
    },
    savedView: () => {
      throw new NotImplementedError(disabledMessage)
    },
    savedViewIfExists: () => {
      return null // intentional - so we dont have to FF guard the query
    }
  },
  Model: {
    homeView: () => null, // intentional - so we dont have to FF guard the query
    resourceIdString: (parent) => parent.id
  },
  ProjectMutations: {
    savedViewMutations: () => {
      throw new NotImplementedError(disabledMessage)
    }
  }
}

export default getFeatureFlags().FF_SAVED_VIEWS_ENABLED ? resolvers : disabledResolvers
