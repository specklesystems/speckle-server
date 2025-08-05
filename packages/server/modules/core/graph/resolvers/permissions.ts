import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

export default {
  Project: {
    permissions: (parent) => ({ projectId: parent.id })
  },
  Model: {
    permissions: (parent) => ({
      projectId: parent.streamId,
      modelId: parent.id
    })
  },
  Version: {
    permissions: (parent) => ({
      projectId: parent.streamId,
      versionId: parent.id
    })
  },
  User: {
    permissions: () => ({})
  },
  PermissionCheckResult: {
    errorMessage: (parent) => (parent.authorized ? undefined : parent.message)
  },
  ProjectPermissionChecks: {
    canCreateModel: async (parent, _args, ctx) => {
      const canCreateModel = await ctx.authPolicies.project.model.canCreate({
        userId: ctx.userId,
        projectId: parent.projectId
      })
      return Authz.toGraphqlResult(canCreateModel)
    },
    canMoveToWorkspace: async (parent, args, ctx) => {
      const canMoveToWorkspace = await ctx.authPolicies.project.canMoveToWorkspace({
        userId: ctx.userId,
        projectId: parent.projectId,
        workspaceId: args.workspaceId ?? undefined
      })
      return Authz.toGraphqlResult(canMoveToWorkspace)
    },
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
    canDelete: async (parent, _args, ctx) => {
      const canDelete = await ctx.authPolicies.project.canDelete({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canDelete)
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
    },
    canRequestRender: async (parent, _args, ctx) => {
      const canRequestRender = await ctx.authPolicies.project.version.canRequestRender({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canRequestRender)
    },
    canPublish: async (parent, _args, ctx) => {
      const canPublish = await ctx.authPolicies.project.canPublish({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canPublish)
    },
    canLoad: async (parent, _args, ctx) => {
      const canLoad = await ctx.authPolicies.project.canLoad({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canLoad)
    },
    canInvite: async (parent, _args, ctx) => {
      const canInvite = await ctx.authPolicies.project.canInvite({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canInvite)
    },
    canReadEmbedTokens: async (parent, _args, ctx) => {
      const canReadEmbedTokens = await ctx.authPolicies.project.canReadEmbedTokens({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canReadEmbedTokens)
    },
    canCreateEmbedTokens: async (parent, _args, ctx) => {
      const canCreateEmbedTokens = await ctx.authPolicies.project.canUpdateEmbedTokens({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canCreateEmbedTokens)
    },
    canRevokeEmbedTokens: async (parent, _args, ctx) => {
      const canUpdateEmbedTokens = await ctx.authPolicies.project.canUpdateEmbedTokens({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canUpdateEmbedTokens)
    }
  },
  ModelPermissionChecks: {
    canUpdate: async (parent, _args, ctx) => {
      const canUpdate = await ctx.authPolicies.project.model.canUpdate({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canUpdate)
    },
    canDelete: async (parent, _args, ctx) => {
      const canDelete = await ctx.authPolicies.project.model.canDelete({
        projectId: parent.projectId,
        userId: ctx.userId,
        modelId: parent.modelId
      })
      return Authz.toGraphqlResult(canDelete)
    },
    canCreateVersion: async (parent, _args, ctx) => {
      const canCreate = await ctx.authPolicies.project.version.canCreate({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canCreate)
    }
  },
  VersionPermissionChecks: {
    canUpdate: async (parent, _args, ctx) => {
      const canUpdate = await ctx.authPolicies.project.version.canUpdate({
        projectId: parent.projectId,
        userId: ctx.userId,
        versionId: parent.versionId
      })
      return Authz.toGraphqlResult(canUpdate)
    },
    canReceive: async (parent, _args, ctx) => {
      const canReceive = await ctx.authPolicies.project.version.canReceive({
        projectId: parent.projectId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canReceive)
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
    },
    canCreateWorkspace: async (_parent, _args, ctx) => {
      const policyResult = await ctx.authPolicies.workspace.canCreateWorkspace({
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(policyResult)
    }
  }
} as Resolvers
