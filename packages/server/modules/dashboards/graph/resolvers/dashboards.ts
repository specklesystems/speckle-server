import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  countDashboardsFactory,
  deleteDashboardRecordFactory,
  getDashboardRecordFactory,
  listDashboardsFactory,
  upsertDashboardFactory
} from '@/modules/dashboards/repositories/management'
import { db } from '@/db/knex'
import {
  createDashboardFactory,
  getPaginatedDashboardsFactory,
  getDashboardFactory,
  updateDashboardFactory,
  deleteDashboardFactory
} from '@/modules/dashboards/services/management'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { toLimitedWorkspace } from '@/modules/workspaces/domain/logic'
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import { getFeatureFlags } from '@speckle/shared/environment'
import { DashboardsModuleDisabledError } from '@/modules/dashboards/errors/dashboards'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { parseWorkspaceIdentifier } from '@/modules/workspacesCore/helpers/graphHelpers'
import { asOperation } from '@/modules/shared/command'
import { logger } from '@/observability/logging'
import {
  revokeTokenResourceAccessDefinitonsFactory,
  storeTokenResourceAccessDefinitionsFactory
} from '@/modules/core/repositories/tokens'
import { getDashboardTokensFactory } from '@/modules/dashboards/repositories/tokens'

const { FF_WORKSPACES_MODULE_ENABLED, FF_DASHBOARDS_MODULE_ENABLED } = getFeatureFlags()

const isEnabled = FF_WORKSPACES_MODULE_ENABLED && FF_DASHBOARDS_MODULE_ENABLED

const resolvers: Resolvers = {
  Query: {
    dashboard: async (_parent, args, context) => {
      const authResult = await context.authPolicies.dashboard.canRead({
        userId: context.userId,
        dashboardId: args.id
      })
      throwIfAuthNotOk(authResult)

      return await getDashboardFactory({
        getDashboard: getDashboardRecordFactory({ db })
      })({ id: args.id })
    }
  },
  Mutation: {
    dashboardMutations: async () => ({})
  },
  Dashboard: {
    // share links
    createdBy: async (parent, _args, context) => {
      return await context.loaders.users.getUser.load(parent.ownerId)
    },
    workspace: async (parent, _args, context) => {
      const workspace = await context.loaders.workspaces?.getWorkspace.load(
        parent.workspaceId
      )

      if (!workspace) {
        throw new WorkspaceNotFoundError()
      }

      return toLimitedWorkspace(workspace)
    }
  },
  Workspace: {
    dashboards: async (parent, args, context) => {
      const authResult = await context.authPolicies.workspace.canListDashboards({
        userId: context.userId,
        workspaceId: parent.id
      })
      throwIfAuthNotOk(authResult)

      return await getPaginatedDashboardsFactory({
        listDashboards: listDashboardsFactory({ db }),
        countDashboards: countDashboardsFactory({ db })
      })({
        workspaceId: parent.id,
        filter: {
          limit: args.limit,
          cursor: args.cursor ?? null,
          projectIds: args.filter?.projectIds ?? [],
          search: args.filter?.search ?? null
        }
      })
    }
  },
  Project: {
    dashboards: async (parent, args, context) => {
      if (!parent.workspaceId) {
        throw new WorkspaceNotFoundError()
      }
      const authResult = await context.authPolicies.workspace.canListDashboards({
        userId: context.userId,
        workspaceId: parent.workspaceId
      })
      throwIfAuthNotOk(authResult)

      return await getPaginatedDashboardsFactory({
        listDashboards: listDashboardsFactory({ db }),
        countDashboards: countDashboardsFactory({ db })
      })({
        workspaceId: parent.workspaceId,
        filter: {
          limit: args.limit,
          cursor: args.cursor ?? null,
          projectIds: [parent.id],
          search: args.filter?.search ?? null
        }
      })
    }
  },
  DashboardMutations: {
    //create share link...
    create: async (_parent, args, context) => {
      const { name } = args.input

      const { id: workspaceId } = await parseWorkspaceIdentifier(
        args.workspace,
        context
      )

      const authResult = await context.authPolicies.workspace.canCreateDashboards({
        userId: context.userId,
        workspaceId
      })
      throwIfAuthNotOk(authResult)

      return await createDashboardFactory({
        upsertDashboard: upsertDashboardFactory({ db })
      })({
        name,
        workspaceId,
        ownerId: context.userId!
      })
    },
    delete: async (_parent, args, context) => {
      const { id: dashboardId } = args

      const authResult = await context.authPolicies.dashboard.canDelete({
        userId: context.userId,
        dashboardId
      })
      throwIfAuthNotOk(authResult)

      await deleteDashboardFactory({
        deleteDashboard: deleteDashboardRecordFactory({ db })
      })({ id: dashboardId })

      return true
    },
    update: async (_parent, args, context) => {
      const { id: dashboardId } = args.input

      const authResult = await context.authPolicies.dashboard.canEdit({
        userId: context.userId,
        dashboardId
      })
      throwIfAuthNotOk(authResult)
      return await asOperation(
        async ({ db }) => {
          return await updateDashboardFactory({
            getDashboard: getDashboardRecordFactory({ db }),
            upsertDashboard: upsertDashboardFactory({ db }),
            storeTokenResourceAccessDefinitions:
              storeTokenResourceAccessDefinitionsFactory({ db }),
            revokeTokenResourceAccess: revokeTokenResourceAccessDefinitonsFactory({
              db
            }),
            getDashboardTokens: getDashboardTokensFactory({ db })
          })(removeNullOrUndefinedKeys(args.input))
        },
        {
          logger,
          name: 'updateDashboard',
          description: 'Update a dashboard',
          db
        }
      )
    }
  }
}

const disabledResolvers: Resolvers = {
  Query: {
    dashboard: async () => {
      throw new DashboardsModuleDisabledError()
    }
  },
  Mutation: {
    dashboardMutations: async () => {
      throw new DashboardsModuleDisabledError()
    }
  },
  Workspace: {
    dashboards: async () => {
      throw new DashboardsModuleDisabledError()
    }
  }
}

export default isEnabled ? resolvers : disabledResolvers
