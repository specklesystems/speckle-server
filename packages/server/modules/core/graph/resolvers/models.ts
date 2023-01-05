import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getModelTreeItems } from '@/modules/core/repositories/branches'
import { getPaginatedProjectModels } from '@/modules/core/services/branch/retrieval'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { getBranchById } from '../../services/branches'
import {
  getCommitsByBranchId,
  getCommitsTotalCountByBranchId
} from '../../services/commits'

export = {
  Project: {
    async models(parent, args) {
      return await getPaginatedProjectModels(parent.id, args)
    },
    async model(_parent, args, ctx) {
      return ctx.loaders.branches.getById.load(args.id)
    },
    async modelsTree(parent) {
      return await getModelTreeItems(parent.id)
    },
    async modelChildrenTree(parent, { fullName }) {
      return await getModelTreeItems(parent.id, fullName)
    }
  },
  Model: {
    async author(parent, _args, ctx) {
      return await ctx.loaders.users.getUser.load(parent.authorId)
    },
    async versionCount(parent, _args, ctx) {
      return await ctx.loaders.branches.getCommitCount.load(parent.id)
    },
    async previewUrl(parent, _args, ctx) {
      const latestCommit = await ctx.loaders.branches.getLatestCommit.load(parent.id)
      const path = `/preview/${parent.streamId}/commits/${latestCommit?.id || ''}`
      return latestCommit ? new URL(path, getServerOrigin()).toString() : null
    },
    async commentThreadCount(parent, _args, ctx) {
      return await ctx.loaders.branches.getCommentThreadCount.load(parent.id)
    },
    async childrenTree(parent) {
      return await getModelTreeItems(parent.streamId, parent.name)
    }
  },
  ModelsTreeItem: {
    async model(parent, _args, ctx) {
      return await ctx.loaders.streams.getStreamBranchByName
        .forStream(parent.projectId)
        .load(parent.fullName)
    },
    async children(parent) {
      return await getModelTreeItems(parent.projectId, parent.fullName)
    }
  }
} as Resolvers
