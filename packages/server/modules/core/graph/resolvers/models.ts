import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  createBranchAndNotifyFactory,
  deleteBranchAndNotifyFactory,
  updateBranchAndNotifyFactory
} from '@/modules/core/services/branch/management'
import {
  getPaginatedProjectModelsFactory,
  getProjectTopLevelModelsTreeFactory
} from '@/modules/core/services/branch/retrieval'
import { getFeatureFlags, getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { last } from 'lodash-es'
import {
  getPaginatedBranchCommitsFactory,
  legacyGetPaginatedStreamCommitsFactory
} from '@/modules/core/services/commit/retrieval'
import {
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import {
  createBranchFactory,
  deleteBranchByIdFactory,
  getBranchByIdFactory,
  getModelTreeItemsFactory,
  getModelTreeItemsFilteredFactory,
  getModelTreeItemsFilteredTotalCountFactory,
  getModelTreeItemsTotalCountFactory,
  getPaginatedProjectModelsItemsFactory,
  getPaginatedProjectModelsTotalCountFactory,
  getStreamBranchByNameFactory,
  updateBranchFactory
} from '@/modules/core/repositories/branches'
import { BranchNotFoundError } from '@/modules/core/errors/branch'
import { CommitNotFoundError } from '@/modules/core/errors/commit'
import {
  getBranchCommitsTotalCountFactory,
  getPaginatedBranchCommitsItemsFactory,
  getSpecificBranchCommitsFactory,
  getStreamCommitCountFactory,
  legacyGetPaginatedStreamCommitsPageFactory
} from '@/modules/core/repositories/commits'
import { db } from '@/db/knex'
import {
  getStreamFactory,
  markBranchStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  getProjectDbClient,
  getRegisteredRegionClients
} from '@/modules/multiregion/utils/dbSelector'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { withOperationLogging } from '@/observability/domain/businessLogging'

export default {
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
    async projectId(parent) {
      return parent.streamId
    },
    async author(parent, _args, ctx) {
      if (!parent.authorId) return null
      return await ctx.loaders.users.getUser.load(parent.authorId)
    },
    async previewUrl(parent, _args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })

      if (getFeatureFlags().FF_SAVED_VIEWS_ENABLED) {
        const homeView = await ctx.loaders
          .forRegion({ db: projectDB })
          .savedViews.getModelHomeSavedView.load({
            modelId: parent.id,
            projectId: parent.streamId
          })

        if (homeView) {
          return homeView.screenshot
        }
      }

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
      const projectId = args.input.projectId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const canCreate = await ctx.authPolicies.project.model.canCreate({
        userId: ctx.userId,
        projectId
      })
      throwIfAuthNotOk(canCreate)

      const projectDB = await getProjectDbClient({ projectId })

      // Sanitize model name by trimming spaces around slashes
      const sanitizedInput = {
        ...args.input,
        name: args.input.name
          .split('/')
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
          .join('/')
      }

      const createBranchAndNotify = createBranchAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDB }),
        createBranch: createBranchFactory({ db: projectDB }),
        eventEmit: getEventBus().emit
      })
      return await withOperationLogging(
        async () => await createBranchAndNotify(sanitizedInput, ctx.userId!),
        {
          logger,
          operationName: 'createModel',
          operationDescription: `Create a new Model`
        }
      )
    },
    async update(_parent, args, ctx) {
      const projectId = args.input.projectId
      const modelId = args.input.id
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        modelId,
        branchId: modelId //legacy
      })

      const canUpdate = await ctx.authPolicies.project.model.canUpdate({
        userId: ctx.userId,
        projectId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDB = await getProjectDbClient({ projectId })
      const updateBranchAndNotify = updateBranchAndNotifyFactory({
        getBranchById: getBranchByIdFactory({ db: projectDB }),
        updateBranch: updateBranchFactory({ db: projectDB }),
        eventEmit: getEventBus().emit
      })
      return await withOperationLogging(
        async () => await updateBranchAndNotify(args.input, ctx.userId!),
        {
          logger,
          operationName: 'updateModel',
          operationDescription: `Update a Model`
        }
      )
    },
    async delete(_parent, args, ctx) {
      const projectId = args.input.projectId
      const modelId = args.input.id
      throwIfResourceAccessNotAllowed({
        resourceId: args.input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        modelId,
        branchId: modelId //legacy
      })

      const canDelete = await ctx.authPolicies.project.model.canDelete({
        userId: ctx.userId,
        projectId,
        modelId
      })
      throwIfAuthNotOk(canDelete)

      const projectDB = await getProjectDbClient({ projectId })
      const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db: projectDB })
      const getStream = getStreamFactory({ db })
      const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
        getStream,
        getBranchById: getBranchByIdFactory({ db: projectDB }),
        emitEvent: getEventBus().emit,
        markBranchStreamUpdated,
        deleteBranchById: deleteBranchByIdFactory({ db: projectDB })
      })
      return await withOperationLogging(
        async () => await deleteBranchAndNotify(args.input, ctx.userId!),
        {
          logger,
          operationName: 'deleteModel',
          operationDescription: `Delete a Model`
        }
      )
    }
  },
  Subscription: {
    projectModelsUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectModelsUpdated,
        async (payload, args, ctx) => {
          const { id: projectId, modelIds } = args
          if (payload.projectId !== projectId) return false

          throwIfResourceAccessNotAllowed({
            resourceAccessRules: ctx.resourceAccessRules,
            resourceId: projectId,
            resourceType: TokenResourceIdentifierType.Project
          })

          const canReadProject = await ctx.authPolicies.project.canRead({
            userId: ctx.userId,
            projectId
          })
          throwIfAuthNotOk(canReadProject)

          if (!modelIds?.length) return true
          return modelIds.includes(payload.projectModelsUpdated.id)
        }
      )
    }
  }
} as Resolvers
