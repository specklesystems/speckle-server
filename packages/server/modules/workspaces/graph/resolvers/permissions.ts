import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

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
    }
  }
} as Resolvers
