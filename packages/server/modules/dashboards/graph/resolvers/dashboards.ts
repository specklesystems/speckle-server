import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  countDashboardsFactory,
  getDashboardRecordFactory,
  listDashboardsFactory,
  upsertDashboardFactory
} from '@/modules/dashboards/repositories/management'
import { db } from '@/db/knex'
import {
  createDashboardFactory,
  getPaginatedDasboardsFactory,
  getDashboardFactory,
  updateDashboardFactory
} from '@/modules/dashboards/services/management'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { toLimitedWorkspace } from '@/modules/workspaces/domain/logic'
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import { getFeatureFlags } from '@speckle/shared/environment'
import { DashboardsModuleDisabledError } from '@/modules/dashboards/errors/dashboards'

const { FF_WORKSPACES_MODULE_ENABLED, FF_DASHBOARDS_MODULE_ENABLED } = getFeatureFlags()

const isEnabled = FF_WORKSPACES_MODULE_ENABLED && FF_DASHBOARDS_MODULE_ENABLED

const resolvers: Resolvers = {
  Query: {
    dashboard: async (_parent, args) => {
      return await getDashboardFactory({
        getDashboard: getDashboardRecordFactory({ db })
      })({ id: args.id })
    }
  },
  Mutation: {
    dashboardMutations: async () => ({})
  },
  Dashboard: {
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
    dashboards: async (parent, args) => {
      // TODO: Policies
      return await getPaginatedDasboardsFactory({
        listDashboards: listDashboardsFactory({ db }),
        countDashboards: countDashboardsFactory({ db })
      })({
        workspaceId: parent.id,
        filter: {
          limit: args.limit,
          cursor: args.cursor ?? null
        }
      })
    }
  },
  DashboardMutations: {
    create: async (_parent, args, context) => {
      const { id, slug } = args.workspace
      const { name } = args.input

      if (!id && !slug) {
        throw new Error('One required!')
      }

      const workspaceId =
        id ?? (await context.loaders.workspaces?.getWorkspaceBySlug.load(slug))?.id

      if (!workspaceId) {
        throw new Error('Workspace not found')
      }

      return await createDashboardFactory({
        upsertDashboard: upsertDashboardFactory({ db })
      })({
        name,
        workspaceId,
        ownerId: context.userId!
      })
    },
    update: async (_parent, args) => {
      return await updateDashboardFactory({
        getDashboard: getDashboardRecordFactory({ db }),
        upsertDashboard: upsertDashboardFactory({ db })
      })(removeNullOrUndefinedKeys(args.input))
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
