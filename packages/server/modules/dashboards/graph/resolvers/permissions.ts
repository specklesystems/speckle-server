import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

const resolvers: Resolvers = {
  WorkspacePermissionChecks: {
    canCreateDashboards: async (parent, _args, context) => {
      const authResult = await context.authPolicies.workspace.canCreateDashboards({
        workspaceId: parent.workspaceId,
        userId: context.userId
      })
      return Authz.toGraphqlResult(authResult)
    },
    canListDashboards: async (parent, _args, context) => {
      const authResult = await context.authPolicies.workspace.canListDashboards({
        workspaceId: parent.workspaceId,
        userId: context.userId
      })
      return Authz.toGraphqlResult(authResult)
    }
  },
  Dashboard: {
    permissions: (parent) => ({ dashboardId: parent.id })
  },
  DashboardPermissionChecks: {
    canCreateToken: async (parent, _args, context) => {
      const authResult = await context.authPolicies.dashboard.canCreateToken({
        userId: context.userId,
        dashboardId: parent.dashboardId
      })
      return Authz.toGraphqlResult(authResult)
    },
    canDelete: async (parent, _args, context) => {
      const authResult = await context.authPolicies.dashboard.canDelete({
        userId: context.userId,
        dashboardId: parent.dashboardId
      })
      return Authz.toGraphqlResult(authResult)
    },
    canEdit: async (parent, _args, context) => {
      const authResult = await context.authPolicies.dashboard.canEdit({
        userId: context.userId,
        dashboardId: parent.dashboardId
      })
      return Authz.toGraphqlResult(authResult)
    },
    canRead: async (parent, _args, context) => {
      const authResult = await context.authPolicies.dashboard.canRead({
        userId: context.userId,
        dashboardId: parent.dashboardId
      })
      return Authz.toGraphqlResult(authResult)
    }
  }
}

export default resolvers
