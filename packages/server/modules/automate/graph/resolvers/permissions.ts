import { Resolvers } from '@/modules/core/graph/generated/graphql'
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
