import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

export default {
  Automation: {
    permissions: (parent) => ({ projectId: parent.projectId })
  },
  AutomationPermissionChecks: {
    canRead: async (parent, _args, context) => {
      const canReadAutomation = await context.authPolicies.project.automation.canRead({
        userId: context.userId,
        projectId: parent.projectId
      })
      return Authz.toGraphqlResult(canReadAutomation)
    },
    canUpdate: async (parent, _args, context) => {
      const canUpdateAutomation =
        await context.authPolicies.project.automation.canUpdate({
          userId: context.userId,
          projectId: parent.projectId
        })
      return Authz.toGraphqlResult(canUpdateAutomation)
    },
    canDelete: async (parent, _args, context) => {
      const canDeleteAutomation =
        await context.authPolicies.project.automation.canDelete({
          userId: context.userId,
          projectId: parent.projectId
        })
      return Authz.toGraphqlResult(canDeleteAutomation)
    }
  },
  AutomateFunction: {
    permissions: (parent) => ({ functionId: parent.id })
  },
  AutomateFunctionPermissionChecks: {
    canRegenerateToken: async (parent, _args, context) => {
      const authResult =
        await context.authPolicies.automate.function.canRegenerateToken({
          functionId: parent.functionId,
          userId: context.userId
        })
      return Authz.toGraphqlResult(authResult)
    }
  },
  ProjectPermissionChecks: {
    canCreateAutomation: async (parent, _args, context) => {
      const canCreateAutomation =
        await context.authPolicies.project.automation.canCreate({
          userId: context.userId,
          projectId: parent.projectId
        })
      return Authz.toGraphqlResult(canCreateAutomation)
    }
  }
} as Resolvers
