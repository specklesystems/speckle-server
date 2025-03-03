import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import { canWorkspaceUseRegionsFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { authorizeResolver } from '@/modules/shared'
import {
  getDefaultRegionFactory,
  upsertRegionAssignmentFactory
} from '@/modules/workspaces/repositories/regions'
import {
  getWorkspaceFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  assignWorkspaceRegionFactory,
  getAvailableRegionsFactory
} from '@/modules/workspaces/services/regions'
import { Roles } from '@speckle/shared'
import { getFeatureFlags, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { WorkspacesNotYetImplementedError } from '@/modules/workspaces/errors/workspace'
import { scheduleJob } from '@/modules/multiregion/services/queue'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'

const { FF_MOVE_PROJECT_REGION_ENABLED } = getFeatureFlags()

export default {
  Workspace: {
    defaultRegion: async (parent) => {
      const getDefaultRegion = getDefaultRegionFactory({ db })
      return await getDefaultRegion({ workspaceId: parent.id })
    }
  },
  WorkspaceMutations: {
    setDefaultRegion: async (_parent, args, ctx) => {
      await authorizeResolver(
        ctx.userId,
        args.workspaceId,
        Roles.Workspace.Admin,
        ctx.resourceAccessRules
      )

      const regionDb = await getDb({ regionKey: args.regionKey })

      const assignRegion = assignWorkspaceRegionFactory({
        getAvailableRegions: getAvailableRegionsFactory({
          getRegions: getRegionsFactory({ db }),
          canWorkspaceUseRegions: canWorkspaceUseRegionsFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db })
          })
        }),
        upsertRegionAssignment: upsertRegionAssignmentFactory({ db }),
        getDefaultRegion: getDefaultRegionFactory({ db }),
        getWorkspace: getWorkspaceFactory({ db }),
        insertRegionWorkspace: upsertWorkspaceFactory({ db: regionDb })
      })
      await assignRegion({ workspaceId: args.workspaceId, regionKey: args.regionKey })

      // Move existing workspace projects to new target region
      const queryAllWorkspaceProjects = queryAllWorkspaceProjectsFactory({
        getStreams: legacyGetStreamsFactory({ db })
      })
      for await (const projects of queryAllWorkspaceProjects({
        workspaceId: args.workspaceId
      })) {
        await Promise.all(
          projects.map((project) =>
            scheduleJob({
              type: 'move-project-region',
              payload: {
                projectId: project.id,
                regionKey: args.regionKey
              }
            })
          )
        )
      }

      return await ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
    }
  },
  WorkspaceProjectMutations: {
    moveToRegion: async (_parent, args, context) => {
      if (!FF_MOVE_PROJECT_REGION_ENABLED && !isTestEnv()) {
        throw new WorkspacesNotYetImplementedError()
      }

      await authorizeResolver(
        context.userId,
        args.projectId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      return await scheduleJob({
        type: 'move-project-region',
        payload: {
          projectId: args.projectId,
          regionKey: args.regionKey
        }
      })
    }
  }
} as Resolvers
