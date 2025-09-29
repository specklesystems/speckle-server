import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { db } from '@/db/knex'
import { DashboardMalformedTokenError } from '@/modules/dashboards/errors/dashboards'
import { createTokenFactory } from '@/modules/core/services/tokens'
import {
  getApiTokenByIdFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  updateApiTokenFactory
} from '@/modules/core/repositories/tokens'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import dayjs from 'dayjs'
import type { SavedViewGroupApiToken } from '@/modules/viewer/domain/types/savedViewGroupApiTokens'
import {
  deleteSavedViewGroupApiTokenFactory,
  getSavedViewGroupApiTokenFactory,
  storeSavedViewGroupApiTokenFactory
} from '@/modules/viewer/repositories/tokens'
import { createSavedViewGroupTokenFactory } from '@/modules/viewer/services/tokens'
import { getSavedViewGroupFactory } from '@/modules/viewer/repositories/dataLoaders/savedViews'

const formatSavedGroupViewTokenToSavedViewGroupShare = (
  token: SavedViewGroupApiToken
) => {
  return {
    ...token,
    id: token.tokenId,
    validUntil: dayjs(token.createdAt)
      .add(Number(token.lifespan), 'milliseconds')
      .toDate()
  }
}

const resolvers: Resolvers = {
  SavedViewGroup: {
    shareLink: async (parent) => {
      const token = await getSavedViewGroupApiTokenFactory({ db })({
        savedViewGroupId: parent.id
      })
      if (!token) return null

      return formatSavedGroupViewTokenToSavedViewGroupShare(token)
    }
  },
  SavedViewMutations: {
    share: async (_, { input }, ctx) => {
      const authResult = await ctx.authPolicies.project.savedViews.canCreateToken({
        userId: ctx.userId,
        projectId: input.projectId,
        savedViewGroupId: input.groupId
      })

      throwIfAuthNotOk(authResult)
      const existingToken = await getSavedViewGroupApiTokenFactory({ db })({
        savedViewGroupId: input.groupId
      })

      if (existingToken) {
        return formatSavedGroupViewTokenToSavedViewGroupShare(existingToken)
      }

      const token = await createSavedViewGroupTokenFactory({
        getSavedViewGroup: getSavedViewGroupFactory({ loaders: ctx.loaders }),
        createToken: createTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({
              db
            })
        }),
        getToken: getApiTokenByIdFactory({ db }),
        storeSavedViewGroupApiToken: storeSavedViewGroupApiTokenFactory({ db })
      })({
        projectId: input.projectId,
        savedViewGroupId: input.groupId,
        userId: ctx.userId!
      })
      return formatSavedGroupViewTokenToSavedViewGroupShare(token.tokenMetadata)
    },
    disableShare: async (_, { input }, ctx) => {
      const authResult = await ctx.authPolicies.project.savedViews.canCreateToken({
        userId: ctx.userId,
        projectId: input.projectId,
        savedViewGroupId: input.groupId
      })
      throwIfAuthNotOk(authResult)
      const token = await getSavedViewGroupApiTokenFactory({ db })({
        savedViewGroupId: input.groupId
      })
      if (!token) throw new DashboardMalformedTokenError()
      await updateApiTokenFactory({ db })(input.shareId, { revoked: true })
      return formatSavedGroupViewTokenToSavedViewGroupShare(token)
    },
    enableShare: async (_, { input }, ctx) => {
      const authResult = await ctx.authPolicies.project.savedViews.canCreateToken({
        userId: ctx.userId,
        projectId: input.projectId,
        savedViewGroupId: input.groupId
      })
      throwIfAuthNotOk(authResult)
      await updateApiTokenFactory({ db })(input.shareId, { revoked: false })
      const token = await getSavedViewGroupApiTokenFactory({ db })({
        savedViewGroupId: input.groupId
      })
      if (!token) throw new DashboardMalformedTokenError()
      return formatSavedGroupViewTokenToSavedViewGroupShare(token)
    },
    deleteShare: async (_, { input }, ctx) => {
      const authResult = await ctx.authPolicies.project.savedViews.canCreateToken({
        userId: ctx.userId,
        projectId: input.projectId,
        savedViewGroupId: input.groupId
      })
      throwIfAuthNotOk(authResult)
      await deleteSavedViewGroupApiTokenFactory({
        db
      })({
        tokenId: input.shareId
      })
      return true
    }
  }
}

export default resolvers
