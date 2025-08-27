import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getDashboardRecordFactory } from '@/modules/dashboards/repositories/management'
import { getDashboardFactory } from '@/modules/dashboards/services/management'
import { db } from '@/db/knex'
import type { StreamRecord } from '@/modules/core/helpers/types'
import {
  DashboardNotFoundError,
  DashboardsModuleDisabledError
} from '@/modules/dashboards/errors/dashboards'
import { createDashboardTokenFactory } from '@/modules/dashboards/services/tokens'
import { createTokenFactory } from '@/modules/core/services/tokens'
import {
  getApiTokenByIdFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import { storeDashboardApiTokenFactory } from '@/modules/dashboards/repositories/tokens'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED, FF_DASHBOARDS_MODULE_ENABLED } = getFeatureFlags()

const isEnabled = FF_WORKSPACES_MODULE_ENABLED && FF_DASHBOARDS_MODULE_ENABLED

const resolvers: Resolvers = {
  DashboardMutations: {
    createToken: async (_parent, args, context) => {
      return await createDashboardTokenFactory({
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
    }
  },
  DashboardToken: {
    dashboard: async (parent) => {
      const dashboard = await getDashboardFactory({
        getDashboard: getDashboardRecordFactory({ db })
      })({ id: parent.dashboardId })

      if (!dashboard) {
        throw new DashboardNotFoundError()
      }

      return dashboard
    },
    projects: async (parent, _args, context) => {
      const dashboard = await getDashboardFactory({
        getDashboard: getDashboardRecordFactory({ db })
      })({ id: parent.dashboardId })

      const projects = await context.loaders.streams.getStream.loadMany(
        dashboard.projectIds ?? []
      )

      return projects.filter(
        (project): project is StreamRecord => !!project && 'id' in project
      )
    },
    user: async (parent, _args, context) => {
      return await context.loaders.users.getUser.load(parent.userId)
    }
  }
}

const disabledResolvers: Resolvers = {
  DashboardMutations: {
    createToken: async () => {
      throw new DashboardsModuleDisabledError()
    }
  }
}

export default isEnabled ? resolvers : disabledResolvers
