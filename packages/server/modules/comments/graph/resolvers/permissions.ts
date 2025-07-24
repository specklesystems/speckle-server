import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

export default {
  Comment: {
    permissions: async (parent) => ({
      commentId: parent.id,
      projectId: parent.streamId
    })
  },
  CommentPermissionChecks: {
    canArchive: async (parent, _args, ctx) => {
      const canArchive = await ctx.authPolicies.project.comment.canArchive({
        ...parent,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canArchive)
    }
  },
  ProjectPermissionChecks: {
    canCreateComment: async (parent, _args, ctx) => {
      const canCreateComment = await ctx.authPolicies.project.comment.canCreate({
        ...parent,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canCreateComment)
    },
    canBroadcastActivity: async (parent, _args, ctx) => {
      const canBroadcastActivity = await ctx.authPolicies.project.canBroadcastActivity({
        ...parent,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canBroadcastActivity)
    }
  }
} as Resolvers
