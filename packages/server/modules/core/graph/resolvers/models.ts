import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getModelTreeItems } from '@/modules/core/repositories/branches'
import { createBranchAndNotify } from '@/modules/core/services/branch/management'
import { getPaginatedProjectModels } from '@/modules/core/services/branch/retrieval'
import { authorizeResolver } from '@/modules/shared'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { last } from 'lodash'
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
    },
    async displayName(parent) {
      return last(parent.name.split('/'))
    },
    async versions(parent, args) {
      const { commits, cursor } = await getCommitsByBranchId({
        branchId: parent.id,
        limit: args.limit,
        cursor: args.cursor
      })
      const totalCount = await getCommitsTotalCountByBranchId({ branchId: parent.id })

      return { items: commits, totalCount, cursor }
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
  },
  Mutation: {
    modelMutations: () => ({})
  },
  ModelMutations: {
    async create(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Contributor
      )
      return await createBranchAndNotify(args.input, ctx.userId!)
    }
  }
} as Resolvers
