import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getPaginatedProjectModels,
  getStructuredStreamModels
} from '@/modules/core/services/branch/retrieval'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'

export = {
  Project: {
    async models(parent, args) {
      return await getPaginatedProjectModels(parent.id, args)
    },
    async structuredModels(parent, args) {
      return {
        totalCount: -1, // TODO: remove, not needed
        structure: await getStructuredStreamModels(parent.id)
      }
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
    }
  }
} as Resolvers
