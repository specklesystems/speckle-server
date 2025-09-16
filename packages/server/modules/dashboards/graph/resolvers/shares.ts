import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getDashboardRecordFactory } from '@/modules/dashboards/repositories/management'
import { db } from '@/db/knex'
import { DashboardsModuleDisabledError } from '@/modules/dashboards/errors/dashboards'
import { createDashboardTokenFactory } from '@/modules/dashboards/services/tokens'
import { createTokenFactory } from '@/modules/core/services/tokens'
import {
  getApiTokenByIdFactory,
  revokeUserTokenByIdFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  updateApiTokenFactory
} from '@/modules/core/repositories/tokens'
import {
  deleteDashboardApiTokenFactory,
  getDashboardTokensFactory,
  storeDashboardApiTokenFactory
} from '@/modules/dashboards/repositories/tokens'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import dayjs from 'dayjs'
import { deleteDashboardShareFactory } from '@/modules/dashboards/services/shares'

const { FF_WORKSPACES_MODULE_ENABLED, FF_DASHBOARDS_MODULE_ENABLED } = getFeatureFlags()

const isEnabled = FF_WORKSPACES_MODULE_ENABLED && FF_DASHBOARDS_MODULE_ENABLED

const resolvers: Resolvers = {
  Dashboard: {
    shareLink: async (parent) => {
      const dashboardTokens = await getDashboardTokensFactory({ db })({
        dashboardId: parent.id
      })
      if (!dashboardTokens.length) return null
      const token = dashboardTokens[0]
      return {
        ...token,
        id: token.tokenId,
        validUntil: dayjs(token.createdAt)
          .add(Number(token.lifespan), 'milliseconds')
          .toDate()
      }
    }
  },
  DashboardMutations: {
    share: async (_, args, context) => {
      const authResult = await context.authPolicies.dashboard.canCreateToken({
        userId: context.userId,
        dashboardId: args.dashboardId
      })
      throwIfAuthNotOk(authResult)
      const token = await createDashboardTokenFactory({
        getDashboard: getDashboardRecordFactory({ db }),
        createToken: createTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({ db })
        }),
        getToken: getApiTokenByIdFactory({ db }),
        storeDashboardApiToken: storeDashboardApiTokenFactory({ db })
      })({
        dashboardId: args.dashboardId,
        userId: context.userId!
      })
      return {
        id: token.tokenMetadata.tokenId,
        content: `${token.tokenMetadata.tokenId}${token.tokenMetadata.content}`,
        createdAt: token.tokenMetadata.createdAt,
        revoked: false,
        validUntil: dayjs(token.tokenMetadata.createdAt)
          .add(Number(token.tokenMetadata.lifespan), 'millisecond')
          .toDate()
      }
    },
    disableShare: async (_, { input }, context) => {
      const authResult = await context.authPolicies.dashboard.canCreateToken({
        userId: context.userId,
        dashboardId: input.dashboardId
      })
      throwIfAuthNotOk(authResult)
      await updateApiTokenFactory({ db })(input.shareId, { revoked: true })

      return true
    },
    enableShare: async (_, { input }, context) => {
      const authResult = await context.authPolicies.dashboard.canCreateToken({
        userId: context.userId,
        dashboardId: input.dashboardId
      })
      throwIfAuthNotOk(authResult)
      await updateApiTokenFactory({ db })(input.shareId, { revoked: false })

      return true
    },
    deleteShare: async (_, { input }, context) => {
      const authResult = await context.authPolicies.dashboard.canCreateToken({
        userId: context.userId,
        dashboardId: input.dashboardId
      })
      throwIfAuthNotOk(authResult)
      await deleteDashboardShareFactory({
        deleteDashboardToken: deleteDashboardApiTokenFactory({ db }),
        revokeUserTokenById: revokeUserTokenByIdFactory({ db })
      })(input)
      return true
    }
  }
}

const disabledResolvers: Resolvers = {
  DashboardMutations: {
    share: async () => {
      throw new DashboardsModuleDisabledError()
    }
  }
}

export default isEnabled ? resolvers : disabledResolvers
