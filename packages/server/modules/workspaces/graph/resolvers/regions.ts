import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import { canWorkspaceUseRegionsFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { getDb, getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { authorizeResolver } from '@/modules/shared'
import {
  getDefaultRegionFactory,
  upsertRegionAssignmentFactory
} from '@/modules/workspaces/repositories/regions'
import {
  copyProjectAutomationsFactory,
  copyProjectCommentsFactory,
  copyProjectBlobs,
  copyProjectModelsFactory,
  copyProjectObjectsFactory,
  copyProjectsFactory,
  copyProjectVersionsFactory,
  copyProjectWebhooksFactory,
  copyWorkspaceFactory
} from '@/modules/workspaces/repositories/projectRegions'
import {
  getWorkspaceFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  assignWorkspaceRegionFactory,
  getAvailableRegionsFactory
} from '@/modules/workspaces/services/regions'
import {
  updateProjectRegionFactory,
  validateProjectRegionCopyFactory
} from '@/modules/workspaces/services/projectRegions'
import { Roles } from '@speckle/shared'
import { getProjectFactory } from '@/modules/core/repositories/projects'
import { getStreamBranchCountFactory } from '@/modules/core/repositories/branches'
import { getStreamCommitCountFactory } from '@/modules/core/repositories/commits'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import { getStreamObjectCountFactory } from '@/modules/core/repositories/objects'
import { getProjectAutomationsTotalCountFactory } from '@/modules/automate/repositories/automations'
import { getFeatureFlags, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { WorkspacesNotYetImplementedError } from '@/modules/workspaces/errors/workspace'
import { getStreamCommentCountFactory } from '@/modules/comments/repositories/comments'
import { getStreamWebhooksFactory } from '@/modules/webhooks/repositories/webhooks'
import {
  getProjectObjectStorage,
  getRegionObjectStorage
} from '@/modules/multiregion/utils/blobStorageSelector'

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

      const sourceDb = await getProjectDbClient({ projectId: args.projectId })
      const sourceObjectStorage = await getProjectObjectStorage({
        projectId: args.projectId
      })
      const targetDb = await (await getDb({ regionKey: args.regionKey })).transaction()
      const targetObjectStorage = await getRegionObjectStorage({
        regionKey: args.regionKey
      })

      const updateProjectRegion = updateProjectRegionFactory({
        getProject: getProjectFactory({ db: sourceDb }),
        getAvailableRegions: getAvailableRegionsFactory({
          getRegions: getRegionsFactory({ db }),
          canWorkspaceUseRegions: canWorkspaceUseRegionsFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db })
          })
        }),
        copyWorkspace: copyWorkspaceFactory({ sourceDb, targetDb }),
        copyProjects: copyProjectsFactory({ sourceDb, targetDb }),
        copyProjectModels: copyProjectModelsFactory({ sourceDb, targetDb }),
        copyProjectVersions: copyProjectVersionsFactory({ sourceDb, targetDb }),
        copyProjectObjects: copyProjectObjectsFactory({ sourceDb, targetDb }),
        copyProjectAutomations: copyProjectAutomationsFactory({ sourceDb, targetDb }),
        copyProjectComments: copyProjectCommentsFactory({ sourceDb, targetDb }),
        copyProjectWebhooks: copyProjectWebhooksFactory({ sourceDb, targetDb }),
        copyProjectBlobs: copyProjectBlobs({
          sourceDb,
          sourceObjectStorage,
          targetDb,
          targetObjectStorage
        }),
        validateProjectRegionCopy: validateProjectRegionCopyFactory({
          countProjectModels: getStreamBranchCountFactory({ db: sourceDb }),
          countProjectVersions: getStreamCommitCountFactory({ db: sourceDb }),
          countProjectObjects: getStreamObjectCountFactory({ db: sourceDb }),
          countProjectAutomations: getProjectAutomationsTotalCountFactory({
            db: sourceDb
          }),
          countProjectComments: getStreamCommentCountFactory({ db: sourceDb }),
          getProjectWebhooks: getStreamWebhooksFactory({ db: sourceDb })
        })
      })

      return await withTransaction(updateProjectRegion(args), targetDb)
    }
  }
} as Resolvers
