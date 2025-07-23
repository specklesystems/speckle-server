import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
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
import { WorkspacesNotYetImplementedError } from '@/modules/workspaces/errors/workspace'
import { scheduleJob } from '@/modules/multiregion/services/queue'
import { getExplicitProjects } from '@/modules/core/repositories/streams'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { queryAllProjectsFactory } from '@/modules/core/services/projects'

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
      const workspaceId = args.workspaceId
      const regionKey = args.regionKey

      await authorizeResolver(
        ctx.userId,
        workspaceId,
        Roles.Workspace.Admin,
        ctx.resourceAccessRules
      )

      const logger = ctx.log.child({
        workspaceId,
        regionKey
      })

      const regionDb = await getDb({ regionKey })

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
      await withOperationLogging(
        async () => await assignRegion({ workspaceId, regionKey }),
        {
          logger,
          operationName: 'assignWorkspaceRegion',
          operationDescription: 'Assign a region to a workspace'
        }
      )

      // Move existing workspace projects to new target region
      if (FF_MOVE_PROJECT_REGION_ENABLED) {
        const queryAllProjects = queryAllProjectsFactory({
          getExplicitProjects: getExplicitProjects({ db })
        })
        for await (const projects of queryAllProjects({
          workspaceId
        })) {
          await Promise.all(
            projects.map(async (project) => {
              await scheduleJob({
                type: 'move-project-region',
                payload: {
                  projectId: project.id,
                  regionKey
                }
              })
            })
          )
        }
      }

      return await ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
    }
  },
  WorkspaceProjectMutations: {
    moveToRegion: async (_parent, args, context) => {
      if (!FF_MOVE_PROJECT_REGION_ENABLED) {
        throw new WorkspacesNotYetImplementedError()
      }

      const projectId = args.projectId
      const regionKey = args.regionKey

      await authorizeResolver(
        context.userId,
        projectId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        regionKey
      })

      return await withOperationLogging(
        async () => {
          return await scheduleJob({
            type: 'move-project-region',
            payload: {
              projectId,
              regionKey
            }
          })
        },
        {
          logger,
          operationName: 'workspaceProjectMoveToRegion',
          operationDescription: 'Move a workspace project to a different region'
        }
      )
    }
  }
} as Resolvers
