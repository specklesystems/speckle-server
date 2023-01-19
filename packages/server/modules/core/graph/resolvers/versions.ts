import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import {
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'

export = {
  Version: {
    async authorUser(parent, _args, ctx) {
      const { author } = parent
      return (await ctx.loaders.users.getUser.load(author)) || null
    },
    async model(parent, _args, ctx) {
      return await ctx.loaders.commits.getCommitBranch.load(parent.id)
    }
  },
  Subscription: {
    projectVersionsUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectVersionsUpdated,
        async (payload, args, ctx) => {
          if (payload.projectId !== args.id) return false

          await authorizeResolver(ctx.userId, payload.projectId, Roles.Stream.Reviewer)
          return true
        }
      )
    }
  }
} as Resolvers
