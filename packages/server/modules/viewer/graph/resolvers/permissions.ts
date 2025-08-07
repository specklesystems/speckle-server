import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { toGraphqlResult } from '@speckle/shared/authz'

const resolvers: Resolvers = {
  ProjectPermissionChecks: {
    canCreateSavedView: async (parent, _args, ctx) => {
      const projectId = parent.projectId
      const canCreate = await ctx.authPolicies.project.savedViews.canCreate({
        userId: ctx.userId,
        projectId
      })
      return toGraphqlResult(canCreate)
    }
  },
  SavedView: {
    permissions: (parent) => ({
      savedView: parent
    })
  },
  SavedViewPermissionChecks: {
    canUpdate: async (parent, _args, ctx) => {
      const savedViewId = parent.savedView.id
      const canUpdate = await ctx.authPolicies.project.savedViews.canUpdate({
        userId: ctx.userId,
        projectId: parent.savedView.projectId,
        savedViewId
      })
      return toGraphqlResult(canUpdate)
    }
  }
}

const disabledMessage = 'Saved views are disabled on this server'
const disabledResolvers: Resolvers = {
  ProjectPermissionChecks: {
    canCreateSavedView: () => {
      return {
        authorized: false,
        message: disabledMessage,
        code: 'SAVED_VIEWS_DISABLED',
        payload: null
      }
    }
  }
}

export default getFeatureFlags().FF_SAVED_VIEWS_ENABLED ? resolvers : disabledResolvers
