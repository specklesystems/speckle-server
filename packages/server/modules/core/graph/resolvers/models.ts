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
  getPaginatedStreamCommits
} from '@/modules/core/services/commit/retrieval'
import {
  filteredSubscribe,
  ProjectSubscriptions
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
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import { db } from '@/db/knex'
import {
  addBranchCreatedActivity,
  addBranchDeletedActivity,
  addBranchUpdatedActivity
} from '@/modules/activitystream/services/branchActivity'
import {
  getStreamFactory,
  markBranchStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import { ModelsEmitter } from '@/modules/core/events/modelsEmitter'

const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db })
const getStream = getStreamFactory({ db })
const getStreamObjects = getStreamObjectsFactory({ db })
const getViewerResourceGroups = getViewerResourceGroupsFactory({
  getStreamObjects,
  getBranchLatestCommits: getBranchLatestCommitsFactory({ db }),
  getStreamBranchesByName: getStreamBranchesByNameFactory({ db }),
  getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
  getAllBranchCommits: getAllBranchCommitsFactory({ db })
})

const getPaginatedProjectModels = getPaginatedProjectModelsFactory({
  getPaginatedProjectModelsItems: getPaginatedProjectModelsItemsFactory({ db }),
  getPaginatedProjectModelsTotalCount: getPaginatedProjectModelsTotalCountFactory({
    db
  })
})
const getModelTreeItems = getModelTreeItemsFactory({ db })
const getProjectTopLevelModelsTree = getProjectTopLevelModelsTreeFactory({
  getModelTreeItemsFiltered: getModelTreeItemsFilteredFactory({ db }),
  getModelTreeItemsFilteredTotalCount: getModelTreeItemsFilteredTotalCountFactory({
    db
  }),
  getModelTreeItems,
  getModelTreeItemsTotalCount: getModelTreeItemsTotalCountFactory({ db })
})
const createBranchAndNotify = createBranchAndNotifyFactory({
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  createBranch: createBranchFactory({ db }),
  addBranchCreatedActivity
})
const updateBranchAndNotify = updateBranchAndNotifyFactory({
  getBranchById: getBranchByIdFactory({ db }),
  updateBranch: updateBranchFactory({ db }),
  addBranchUpdatedActivity
})
const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
  getStream,
  getBranchById: getBranchByIdFactory({ db }),
  modelsEventsEmitter: ModelsEmitter.emit,
  markBranchStreamUpdated,
  addBranchDeletedActivity,
  deleteBranchById: deleteBranchByIdFactory({ db })
})

const getPaginatedBranchCommits = getPaginatedBranchCommitsFactory({
  getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
  getPaginatedBranchCommitsItems: getPaginatedBranchCommitsItemsFactory({ db }),
  getBranchCommitsTotalCount: getBranchCommitsTotalCountFactory({ db })
})

export = {
  User: {
    async versions(parent, args, ctx) {
      const authoredOnly = args.authoredOnly
      return {
        totalCount: authoredOnly
          ? await ctx.loaders.users.getAuthoredCommitCount.load(parent.id)
          : await ctx.loaders.users.getStreamCommitCount.load(parent.id)
      }
    }
  },
  Project: {
    async models(parent, args, ctx) {
      // If limit=0 & no filter, short-cut full execution and use data loader
      if (args.limit === 0 && !args.filter) {
        return {
          totalCount: await ctx.loaders.streams.getBranchCount.load(parent.id),
          items: [],
          cursor: null
        }
      }

      return await getPaginatedProjectModels(parent.id, args)
    },
    async model(_parent, args, ctx) {
      const model = await ctx.loaders.branches.getById.load(args.id)
      if (!model) {
        throw new BranchNotFoundError('Model not found')
      }

      return model
    },
    async modelByName(parent, args, ctx) {
      const model = await ctx.loaders.streams.getStreamBranchByName
        .forStream(parent.id)
        .load(args.name)
      if (!model) {
        throw new BranchNotFoundError('Model not found')
      }

      return model
    },
    async modelsTree(parent, args) {
      return await getProjectTopLevelModelsTree(parent.id, args)
    },
    async modelChildrenTree(parent, { fullName }) {
      return await getModelTreeItems(
        parent.id,
        {},
        {
          parentModelName: fullName
        }
      )
    },
    async viewerResources(parent, { resourceIdString, loadedVersionsOnly }) {
      return await getViewerResourceGroups({
        projectId: parent.id,
        resourceIdString,
        loadedVersionsOnly
      })
    },
    async versions(parent, args, ctx) {
      // If limit=0, short-cut full execution and use data loader
      if (args.limit === 0) {
        return {
          totalCount: await ctx.loaders.streams.getCommitCountWithoutGlobals.load(
            parent.id
          ),
          items: [],
          cursor: null
        }
      }

      return await getPaginatedStreamCommits(parent.id, args)
    }
  },
  Model: {
    async author(parent, _args, ctx) {
      return await ctx.loaders.users.getUser.load(parent.authorId)
    },
    async previewUrl(parent, _args, ctx) {
      const latestCommit = await ctx.loaders.branches.getLatestCommit.load(parent.id)
      const path = `/preview/${parent.streamId}/commits/${latestCommit?.id || ''}`
      return latestCommit ? new URL(path, getServerOrigin()).toString() : null
    },
    async childrenTree(parent) {
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
      // If limit=0 & no filter, short-cut full execution and use data loader
      if (!args.filter && args.limit === 0) {
        return {
          totalCount: await ctx.loaders.branches.getCommitCount.load(parent.id),
          items: [],
          cursor: null
        }
      }

      return await getPaginatedBranchCommits({
        branchId: parent.id,
        cursor: args.cursor,
        limit: args.limit,
        filter: args.filter
      })
    },
    async version(parent, args, ctx) {
      const version = await ctx.loaders.branches.getBranchCommit.load({
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
      return await ctx.loaders.streams.getStreamBranchByName
        .forStream(parent.projectId)
        .load(parent.fullName)
    },
    async children(parent) {
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
      return await createBranchAndNotify(args.input, ctx.userId!)
    },
    async update(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )
      return await updateBranchAndNotify(args.input, ctx.userId!)
    },
    async delete(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )
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
