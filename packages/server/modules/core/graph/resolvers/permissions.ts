import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

export default {
  Project: {
    permissions: (parent) => ({ projectId: parent.id })
  },
  ProjectPermissionChecks: {
    canCreateModel: async (parent, _args, ctx) => {
      const canCreateModel = await ctx.authPolicies.project.canCreateModel({
        userId: ctx.userId,
        projectId: parent.projectId
      })
      return Authz.toGraphqlResult(canCreateModel)
    },
    canMoveToWorkspace: async (parent, args, ctx) => {
      const canMoveToWorkspace = await ctx.authPolicies.project.canMoveToWorkspace({
        userId: ctx.userId,
        projectId: parent.projectId,
        workspaceId: args.workspaceId
      })
      return Authz.toGraphqlResult(canMoveToWorkspace)
    },
    canRead: async (parent, _args, ctx) => {
      const canRead = await ctx.authPolicies.project.canRead({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canRead)
    }
  }
} as Resolvers
