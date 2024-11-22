import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  createBranchAndNotifyFactory,
  deleteBranchAndNotifyFactory,
  updateBranchAndNotifyFactory
} from '@/modules/core/services/branch/management'
import {
  getPaginatedProjectModelsFactory,
  getProjectTopLevelModelsTreeFactory
} from '@/modules/core/services/branch/retrieval'
import { authorizeResolver } from '@/modules/shared'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { last } from 'lodash'

import { getViewerResourceGroupsFactory } from '@/modules/core/services/commit/viewerResources'
import {
  getPaginatedBranchCommitsFactory,
  legacyGetPaginatedStreamCommitsFactory
} from '@/modules/core/services/commit/retrieval'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  publish
} from '@/modules/shared/utils/subscriptions'
import {
  createBranchFactory,
  deleteBranchByIdFactory,
  getBranchByIdFactory,
  getBranchLatestCommitsFactory,
  getModelTreeItemsFactory,
  getModelTreeItemsFilteredFactory,
  getModelTreeItemsFilteredTotalCountFactory,
  getModelTreeItemsTotalCountFactory,
  getPaginatedProjectModelsItemsFactory,
  getPaginatedProjectModelsTotalCountFactory,
  getStreamBranchByNameFactory,
  getStreamBranchesByNameFactory,
  updateBranchFactory
} from '@/modules/core/repositories/branches'
import { BranchNotFoundError } from '@/modules/core/errors/branch'
import { CommitNotFoundError } from '@/modules/core/errors/commit'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import {
  getAllBranchCommitsFactory,
  getBranchCommitsTotalCountFactory,
  getPaginatedBranchCommitsItemsFactory,
  getSpecificBranchCommitsFactory,
  getStreamCommitCountFactory,
  legacyGetPaginatedStreamCommitsPageFactory
} from '@/modules/core/repositories/commits'
import { db } from '@/db/knex'
import {
  addBranchCreatedActivityFactory,
  addBranchDeletedActivityFactory,
  addBranchUpdatedActivityFactory
} from '@/modules/activitystream/services/branchActivity'
import {
  getStreamFactory,
  markBranchStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import { ModelsEmitter } from '@/modules/core/events/modelsEmitter'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  getProjectDbClient,
  getRegisteredRegionClients
} from '@/modules/multiregion/dbSelector'

export = {
  User: {
    async versions(parent, args, ctx) {
      const authoredOnly = args.authoredOnly
      const regionClients = await getRegisteredRegionClients()
      const allLoaders = [
        ctx.loaders,
        ...Object.values(regionClients).map((db) => ctx.loaders.forRegion({ db }))
      ]
      let counts: number[]
      if (authoredOnly) {
        counts = await Promise.all(
          allLoaders.map((loader) =>
            loader.users.getAuthoredCommitCount.load(parent.id)
          )
        )
      } else {
        counts = await Promise.all(
          allLoaders.map((loader) => loader.users.getStreamCommitCount.load(parent.id))
        )
      }
      return {
        totalCount: counts.reduce((acc, curr) => acc + curr, 0)
      }
    }
  },
  Project: {
    async models(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      // If limit=0 & no filter, short-cut full execution and use data loader
      if (args.limit === 0 && !args.filter) {
        return {
          totalCount: await ctx.loaders
            .forRegion({ db: projectDB })
            .streams.getBranchCount.load(parent.id),
          items: [],
          cursor: null
        }
      }

      const getPaginatedProjectModels = getPaginatedProjectModelsFactory({
        getPaginatedProjectModelsItems: getPaginatedProjectModelsItemsFactory({
          db: projectDB
        }),
        getPaginatedProjectModelsTotalCount: getPaginatedProjectModelsTotalCountFactory(
          {
            db: projectDB
          }
        )
      })
      return await getPaginatedProjectModels(parent.id, args)
    },
    async model(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const model = await ctx.loaders
        .forRegion({ db: projectDB })
        .branches.getById.load(args.id)
      if (!model) {
        throw new BranchNotFoundError('Model not found')
      }

      return model
    },
    async modelByName(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const model = await ctx.loaders
        .forRegion({ db: projectDB })
        .streams.getStreamBranchByName.forStream(parent.id)
        .load(args.name)
      if (!model) {
        throw new BranchNotFoundError('Model not found')
      }

      return model
    },
    async modelsTree(parent, args) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const getModelTreeItems = getModelTreeItemsFactory({ db: projectDB })
      const getProjectTopLevelModelsTree = getProjectTopLevelModelsTreeFactory({
        getModelTreeItemsFiltered: getModelTreeItemsFilteredFactory({ db: projectDB }),
        getModelTreeItemsFilteredTotalCount: getModelTreeItemsFilteredTotalCountFactory(
          {
            db: projectDB
          }
        ),
        getModelTreeItems,
        getModelTreeItemsTotalCount: getModelTreeItemsTotalCountFactory({
          db: projectDB
        })
      })
      return await getProjectTopLevelModelsTree(parent.id, args)
    },
    async modelChildrenTree(parent, { fullName }) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const getModelTreeItems = getModelTreeItemsFactory({ db: projectDB })
      return await getModelTreeItems(
        parent.id,
        {},
        {
          parentModelName: fullName
        }
      )
    },
    async viewerResources(parent, { resourceIdString, loadedVersionsOnly }) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const getStreamObjects = getStreamObjectsFactory({ db: projectDB })
      const getViewerResourceGroups = getViewerResourceGroupsFactory({
        getStreamObjects,
        getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDB }),
        getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDB }),
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDB }),
        getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDB })
      })
      return await getViewerResourceGroups({
        projectId: parent.id,
        resourceIdString,
        loadedVersionsOnly
      })
    },
    async versions(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      // If limit=0, short-cut full execution and use data loader
      if (args.limit === 0) {
        return {
          totalCount: await ctx.loaders
            .forRegion({ db: projectDB })
            .streams.getCommitCountWithoutGlobals.load(parent.id),
          items: [],
          cursor: null
        }
      }

      const getPaginatedStreamCommits = legacyGetPaginatedStreamCommitsFactory({
        legacyGetPaginatedStreamCommitsPage: legacyGetPaginatedStreamCommitsPageFactory(
          {
            db: projectDB
          }
        ),
        getStreamCommitCount: getStreamCommitCountFactory({ db: projectDB })
      })
      return await getPaginatedStreamCommits(parent.id, args)
    }
  },
  Model: {
    async author(parent, _args, ctx) {
      return await ctx.loaders.users.getUser.load(parent.authorId)
    },
    async previewUrl(parent, _args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const latestCommit = await ctx.loaders
        .forRegion({ db: projectDB })
        .branches.getLatestCommit.load(parent.id)
      const path = `/preview/${parent.streamId}/commits/${latestCommit?.id || ''}`
      return latestCommit ? new URL(path, getServerOrigin()).toString() : null
    },
    async childrenTree(parent) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const getModelTreeItems = getModelTreeItemsFactory({ db: projectDB })
      return await getModelTreeItems(
        parent.streamId,
        {},
        {
          parentModelName: parent.name
        }
      )
    },
    async displayName(parent) {
      return last(parent.name.split('/'))
    },
    async versions(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      // If limit=0 & no filter, short-cut full execution and use data loader
      if (!args.filter && args.limit === 0) {
        return {
          totalCount: await ctx.loaders
            .forRegion({ db: projectDB })
            .branches.getCommitCount.load(parent.id),
          items: [],
          cursor: null
        }
      }

      const getPaginatedBranchCommits = getPaginatedBranchCommitsFactory({
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDB }),
        getPaginatedBranchCommitsItems: getPaginatedBranchCommitsItemsFactory({
          db: projectDB
        }),
        getBranchCommitsTotalCount: getBranchCommitsTotalCountFactory({ db: projectDB })
      })
      return await getPaginatedBranchCommits({
        branchId: parent.id,
        cursor: args.cursor,
        limit: args.limit,
        filter: args.filter
      })
    },
    async version(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const version = await ctx.loaders
        .forRegion({ db: projectDB })
        .branches.getBranchCommit.load({
          branchId: parent.id,
          commitId: args.id
        })
      if (!version) {
        throw new CommitNotFoundError('Version not found')
      }

      return version
    }
  },
  ModelsTreeItem: {
    async model(parent, _args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.projectId })
      return await ctx.loaders
        .forRegion({ db: projectDB })
        .streams.getStreamBranchByName.forStream(parent.projectId)
        .load(parent.fullName)
    },
    async children(parent) {
      const projectDB = await getProjectDbClient({ projectId: parent.projectId })
      const getModelTreeItems = getModelTreeItemsFactory({ db: projectDB })
      return await getModelTreeItems(
        parent.projectId,
        {},
        {
          parentModelName: parent.fullName
        }
      )
    }
  },
  Mutation: {
    modelMutations: () => ({})
  },
  ModelMutations: {
    async create(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )
      const projectDB = await getProjectDbClient({ projectId: args.input.projectId })
      const createBranchAndNotify = createBranchAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDB }),
        createBranch: createBranchFactory({ db: projectDB }),
        addBranchCreatedActivity: addBranchCreatedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })
      })
      return await createBranchAndNotify(args.input, ctx.userId!)
    },
    async update(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )
      const projectDB = await getProjectDbClient({ projectId: args.input.projectId })
      const updateBranchAndNotify = updateBranchAndNotifyFactory({
        getBranchById: getBranchByIdFactory({ db: projectDB }),
        updateBranch: updateBranchFactory({ db: projectDB }),
        addBranchUpdatedActivity: addBranchUpdatedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })
      })
      return await updateBranchAndNotify(args.input, ctx.userId!)
    },
    async delete(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )
      const projectDB = await getProjectDbClient({ projectId: args.input.projectId })
      const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db: projectDB })
      const getStream = getStreamFactory({ db })
      const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
        getStream,
        getBranchById: getBranchByIdFactory({ db: projectDB }),
        modelsEventsEmitter: ModelsEmitter.emit,
        markBranchStreamUpdated,
        addBranchDeletedActivity: addBranchDeletedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        }),
        deleteBranchById: deleteBranchByIdFactory({ db: projectDB })
      })
      return await deleteBranchAndNotify(args.input, ctx.userId!)
    }
  },
  Subscription: {
    projectModelsUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectModelsUpdated,
        async (payload, args, ctx) => {
          const { id: projectId, modelIds } = args
          if (payload.projectId !== projectId) return false

          await authorizeResolver(
            ctx.userId,
            projectId,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )
          if (!modelIds?.length) return true
          return modelIds.includes(payload.projectModelsUpdated.id)
        }
      )
    }
  }
} as Resolvers
