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
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import {
  deleteDashboardApiTokenFactory,
  storeDashboardApiTokenFactory
} from '@/modules/dashboards/repositories/tokens'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import dayjs from 'dayjs'
import { deleteDashboardShareFactory } from '@/modules/dashboards/services/shares'

const { FF_WORKSPACES_MODULE_ENABLED, FF_DASHBOARDS_MODULE_ENABLED } = getFeatureFlags()

const isEnabled = FF_WORKSPACES_MODULE_ENABLED && FF_DASHBOARDS_MODULE_ENABLED

const resolvers: Resolvers = {
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
        validUntil: dayjs(token.tokenMetadata.createdAt)
          .add(Number(token.tokenMetadata.lifespan), 'millisecond')
          .toDate()
      }
    },
    deleteShare: async (_, { input }, context) => {
      const authResult = await context.authPolicies.dashboard.canCreateToken({
        userId: context.userId,
        dashboardId: input.dasbboardId
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
