import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getPaginatedProjectModels } from '@/modules/core/services/branch/retrieval'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'

export = {
  Project: {
    async models(parent, args) {
      return await getPaginatedProjectModels(parent.id, args)
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
      return new URL(path, getServerOrigin()).toString()
    }
  }
} as Resolvers
