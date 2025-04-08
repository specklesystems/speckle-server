import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

export default {
  Project: {
    permissions: (parent) => ({ projectId: parent.id })
  },
  User: {
    permissions: () => ({})
  },
  ProjectPermissionChecks: {
    canRead: async (parent, _args, ctx) => {
      const canRead = await ctx.authPolicies.project.canRead({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canRead)
    },
    canUpdate: async (parent, _args, ctx) => {
      const canUpdate = await ctx.authPolicies.project.canUpdate({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canUpdate)
    },
    canUpdateAllowPublicComments: async (parent, _args, ctx) => {
      const canUpdateAllowPublicComments =
        await ctx.authPolicies.project.canUpdateAllowPublicComments({
          projectId: parent.projectId,
          userId: ctx.userId
        })
      return Authz.toGraphqlResult(canUpdateAllowPublicComments)
    },
    canReadSettings: async (parent, _args, ctx) => {
      const canReadSettings = await ctx.authPolicies.project.canReadSettings({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canReadSettings)
    },
    canReadWebhooks: async (parent, _args, ctx) => {
      const canReadWebhooks = await ctx.authPolicies.project.canReadWebhooks({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canReadWebhooks)
    },
    canLeave: async (parent, _args, ctx) => {
      const canLeave = await ctx.authPolicies.project.canLeave({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canLeave)
    }
  },
  RootPermissionChecks: {
    canCreatePersonalProject: async (_parent, _args, ctx) => {
      const canCreatePersonalProject = await ctx.authPolicies.project.canCreatePersonal(
        {
          userId: ctx.userId
        }
      )
      return Authz.toGraphqlResult(canCreatePersonalProject)
    }
  }
} as Resolvers
