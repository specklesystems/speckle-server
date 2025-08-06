import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Authz } from '@speckle/shared'

const resolvers: Resolvers = {
  ProjectPermissionChecks: {
    async canReadAccIntegrationSettings(parent, _args, ctx) {
      const authResult = await ctx.authPolicies.project.canReadAccIntegrationSettings({
        userId: ctx.userId,
        projectId: parent.projectId
      })
      return Authz.toGraphqlResult(authResult)
    }
  }
}

export default resolvers
