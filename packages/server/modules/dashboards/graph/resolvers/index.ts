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
  getDashboardFactory
} from '@/modules/dashboards/services/management'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { toLimitedWorkspace } from '@/modules/workspaces/domain/logic'

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
  Project: {
    dashboards: async (parent, args) => {
      const { workspaceId } = parent

      // TODO: Policies

      if (!workspaceId) {
        return {
          items: [],
          totalCount: 0
        }
      }

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
      const { name, workspaceId } = args.input

      return await createDashboardFactory({
        upsertDashboard: upsertDashboardFactory({ db })
      })({
        name,
        workspaceId,
        ownerId: context.userId!
      })
    }
  }
}

export default resolvers
