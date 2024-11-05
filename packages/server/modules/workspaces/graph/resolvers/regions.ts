import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { authorizeResolver } from '@/modules/shared'
import {
  deleteAllRegionAssignmentsFactory,
  getDefaultRegionFactory,
  upsertRegionAssignmentFactory
} from '@/modules/workspaces/repositories/regions'
import {
  assignRegionFactory,
  getAvailableRegionsFactory
} from '@/modules/workspaces/services/regions'
import { Roles } from '@speckle/shared'

export default {
  Workspace: {
    availableRegions: async (parent) => {
      const getAvailableRegions = getAvailableRegionsFactory({
        getRegions: getRegionsFactory({ db })
      })

      return await getAvailableRegions({ workspaceId: parent.id })
    },
    defaultRegion: async (parent) => {
      const getDefaultRegion = getDefaultRegionFactory({ db })
      return await getDefaultRegion({ workspaceId: parent.id })
    }
  },
  WorkspaceMutations: {
    setDefaultRegion: async (parent, args, ctx) => {
      await authorizeResolver(
        ctx.userId,
        args.workspaceId,
        Roles.Workspace.Admin,
        ctx.resourceAccessRules
      )

      const assignRegion = assignRegionFactory({
        getAvailableRegions: getAvailableRegionsFactory({
          getRegions: getRegionsFactory({ db })
        }),
        upsertRegionAssignment: upsertRegionAssignmentFactory({ db }),
        deleteAllRegionAssignments: deleteAllRegionAssignmentsFactory({ db })
      })
      await assignRegion({ workspaceId: args.workspaceId, regionKey: args.regionKey })

      return await ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
    }
  }
} as Resolvers
