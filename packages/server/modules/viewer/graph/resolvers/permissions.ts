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
  SavedViewGroup: {
    permissions: (parent) => ({
      savedViewGroup: parent
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
    },
    canMove: async (parent, _args, ctx) => {
      const savedViewId = parent.savedView.id
      const canMove = await ctx.authPolicies.project.savedViews.canMove({
        userId: ctx.userId,
        projectId: parent.savedView.projectId,
        savedViewId
      })
      return toGraphqlResult(canMove)
    },
    canEditTitle: async (parent, _args, ctx) => {
      const savedViewId = parent.savedView.id
      const canEditTitle = await ctx.authPolicies.project.savedViews.canEditTitle({
        userId: ctx.userId,
        projectId: parent.savedView.projectId,
        savedViewId
      })
      return toGraphqlResult(canEditTitle)
    },
    canEditDescription: async (parent, _args, ctx) => {
      const savedViewId = parent.savedView.id
      const canEditDescription =
        await ctx.authPolicies.project.savedViews.canEditDescription({
          userId: ctx.userId,
          projectId: parent.savedView.projectId,
          savedViewId
        })
      return toGraphqlResult(canEditDescription)
    }
  },
  SavedViewGroupPermissionChecks: {
    canCreateToken: async (parent, _args, ctx) => {
      const savedViewGroupId = parent.savedViewGroup.id
      const authResult = await ctx.authPolicies.project.savedViews.canUpdateGroup({
        userId: ctx.userId,
        projectId: parent.savedViewGroup.projectId,
        savedViewGroupId
      })
      return toGraphqlResult(authResult)
    },
    canUpdate: async (parent, _args, ctx) => {
      const savedViewGroupId = parent.savedViewGroup.id
      const canUpdate = await ctx.authPolicies.project.savedViews.canUpdateGroup({
        userId: ctx.userId,
        projectId: parent.savedViewGroup.projectId,
        savedViewGroupId
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
