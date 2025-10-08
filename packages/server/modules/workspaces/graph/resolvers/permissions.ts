import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz, WorkspacePlanFeatures } from '@speckle/shared'

export default {
  Workspace: {
    permissions: (parent) => ({
      workspaceId: parent.id
    })
  },
  WorkspacePermissionChecks: {
    canCreateProject: async (parent, _args, ctx) => {
      const canCreateProject = await ctx.authPolicies.workspace.canCreateProject({
        workspaceId: parent.workspaceId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canCreateProject)
    },
    canInvite: async (parent, _args, ctx) => {
      const canInvite = await ctx.authPolicies.workspace.canInvite({
        workspaceId: parent.workspaceId,
        userId: ctx.userId
      })
      return Authz.toGraphqlResult(canInvite)
    },
    canMoveProjectToWorkspace: async (parent, args, ctx) => {
      const canMoveProjectToWorkspace =
        await ctx.authPolicies.project.canMoveToWorkspace({
          userId: ctx.userId,
          projectId: args.projectId ?? undefined,
          workspaceId: parent.workspaceId
        })
      return Authz.toGraphqlResult(canMoveProjectToWorkspace)
    },
    canEditEmbedOptions: async (parent, _args, ctx) => {
      const canEditEmbedOptions =
        await ctx.authPolicies.workspace.canUseWorkspacePlanFeature({
          userId: ctx.userId,
          workspaceId: parent.workspaceId,
          feature: WorkspacePlanFeatures.HideSpeckleBranding
        })
      return Authz.toGraphqlResult(canEditEmbedOptions)
    },
    canMakeWorkspaceExclusive: async (parent, _args, ctx) => {
      const canEditEmbedOptions =
        await ctx.authPolicies.workspace.canUseWorkspacePlanFeature({
          userId: ctx.userId,
          workspaceId: parent.workspaceId,
          feature: WorkspacePlanFeatures.ExclusiveMembership
        })
      return Authz.toGraphqlResult(canEditEmbedOptions)
    },
    canReadMemberEmail: async (parent, _args, ctx) => {
      const policyResult = await ctx.authPolicies.workspace.canReadMemberEmail({
        userId: ctx.userId,
        workspaceId: parent.workspaceId
      })
      return Authz.toGraphqlResult(policyResult)
    }
  }
} as Resolvers
