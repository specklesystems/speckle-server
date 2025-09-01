import type { CommandModule } from 'yargs'
import { cliLogger as logger } from '@/observability/logging'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import {
  getStreamCollaboratorsFactory,
  getStreamFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  createBranchFactory,
  getBranchByIdFactory,
  getBranchesByIdsFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchByNameFactory,
  getStreamBranchesByNameFactory,
  markCommitBranchUpdatedFactory
} from '@/modules/core/repositories/branches'
import { createCommitByBranchIdFactory } from '@/modules/core/services/commit/management'
import {
  getObjectFactory,
  getStreamObjectsFactory,
  storeSingleObjectIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import {
  createCommentReplyAndNotifyFactory,
  createCommentThreadAndNotifyFactory
} from '@/modules/comments/services/management'
import { createBranchAndNotifyFactory } from '@/modules/core/services/branch/management'
import {
  createCommitFactory,
  getAllBranchCommitsFactory,
  getCommitsAndTheirBranchIdsFactory,
  getSpecificBranchCommitsFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getViewerResourcesForCommentFactory,
  getViewerResourcesForCommentsFactory,
  getViewerResourcesFromLegacyIdentifiersFactory
} from '@/modules/core/services/commit/viewerResources'
import { db } from '@/db/knex'
import {
  getCommentFactory,
  getCommentsResourcesFactory,
  insertCommentLinksFactory,
  insertCommentsFactory,
  markCommentUpdatedFactory,
  markCommentViewedFactory
} from '@/modules/comments/repositories/comments'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { validateInputAttachmentsFactory } from '@/modules/comments/services/commentTextService'
import { getUserFactory } from '@/modules/core/repositories/users'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import { authorizeResolver } from '@/modules/shared'
import { Roles } from '@speckle/shared'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { createNewProjectFactory } from '@/modules/core/services/projects'
import {
  storeProjectFactory,
  storeProjectRoleFactory
} from '@/modules/core/repositories/projects'
import { storeModelFactory } from '@/modules/core/repositories/models'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/viewer/services/viewerResources'
import {
  getModelHomeSavedViewFactory,
  getSavedViewFactory
} from '@/modules/viewer/repositories/savedViews'

const command: CommandModule<
  unknown,
  {
    projectUrl: string
    authorId: string
    syncComments: boolean
    token?: string
    workspaceId?: string
  }
> = {
  command: 'project <projectUrl> <authorId> [syncComments]',
  describe: 'Download a project from an external Speckle server instance',
  builder: {
    projectUrl: {
      describe:
        'Public Project URL (e.g. https://latest.speckle.systems/projects/594d657cdd)',
      type: 'string'
    },
    authorId: {
      describe: 'ID of the local user that will own the project',
      type: 'string'
    },
    syncComments: {
      describe: 'Whether or not to sync comments as well',
      type: 'boolean',
      default: true
    },
    token: {
      describe: 'Target server auth token, in case the stream is private',
      type: 'string'
    },
    workspaceId: {
      describe: 'Target workspace id',
      type: 'string'
    }
  },
  handler: async (argv) => {
    let projectDb = db
    let regionKey: string | undefined = undefined

    if (argv.workspaceId) {
      await authorizeResolver(
        argv.authorId,
        argv.workspaceId,
        Roles.Workspace.Member,
        null
      )
      const workspaceDefaultRegion = await getDefaultRegionFactory({ db })({
        workspaceId: argv.workspaceId
      })
      regionKey = workspaceDefaultRegion?.key
      projectDb = await getDb({ regionKey })
    }

    const getStream = getStreamFactory({ db: projectDb })
    const getObject = getObjectFactory({ db: projectDb })
    const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db: projectDb })

    const getStreamObjects = getStreamObjectsFactory({ db: projectDb })
    const markCommentViewed = markCommentViewedFactory({ db: projectDb })
    const validateInputAttachments = validateInputAttachmentsFactory({
      getBlobs: getBlobsFactory({ db: projectDb })
    })
    const insertComments = insertCommentsFactory({ db: projectDb })
    const insertCommentLinks = insertCommentLinksFactory({ db: projectDb })
    const getViewerResourceItemsUngrouped = getViewerResourceItemsUngroupedFactory({
      getViewerResourceGroups: getViewerResourceGroupsFactory({
        getStreamObjects,
        getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDb }),
        getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDb }),
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDb }),
        getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDb }),
        getBranchesByIds: getBranchesByIdsFactory({ db: projectDb }),
        getSavedView: getSavedViewFactory({ db: projectDb }),
        getModelHomeSavedView: getModelHomeSavedViewFactory({ db: projectDb })
      })
    })
    const getViewerResourcesFromLegacyIdentifiers =
      getViewerResourcesFromLegacyIdentifiersFactory({
        getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
          getCommentsResources: getCommentsResourcesFactory({ db: projectDb }),
          getViewerResourcesFromLegacyIdentifiers: (...args) =>
            getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
        }),
        getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({
          db: projectDb
        }),
        getStreamObjects
      })
    const createCommentThreadAndNotify = createCommentThreadAndNotifyFactory({
      getViewerResourceItemsUngrouped,
      validateInputAttachments,
      insertComments,
      insertCommentLinks,
      markCommentViewed,
      emitEvent: getEventBus().emit
    })
    const createCommentReplyAndNotify = createCommentReplyAndNotifyFactory({
      getComment: getCommentFactory({ db: projectDb }),
      validateInputAttachments,
      insertComments,
      insertCommentLinks,
      markCommentUpdated: markCommentUpdatedFactory({ db: projectDb }),
      emitEvent: getEventBus().emit,
      getViewerResourcesForComment: getViewerResourcesForCommentFactory({
        getCommentsResources: getCommentsResourcesFactory({ db: projectDb }),
        getViewerResourcesFromLegacyIdentifiers
      })
    })

    const createCommitByBranchId = createCommitByBranchIdFactory({
      createCommit: createCommitFactory({ db: projectDb }),
      getObject,
      getBranchById: getBranchByIdFactory({ db: projectDb }),
      insertStreamCommits: insertStreamCommitsFactory({ db: projectDb }),
      insertBranchCommits: insertBranchCommitsFactory({ db: projectDb }),
      markCommitStreamUpdated,
      markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb }),
      emitEvent: getEventBus().emit
    })

    const getUser = getUserFactory({ db })

    const createNewProject = createNewProjectFactory({
      // TODO: this goes as event emmits outside  (default model)
      storeProject: storeProjectFactory({ db: projectDb }),
      storeModel: storeModelFactory({ db: projectDb }),
      // THIS MUST GO TO THE MAIN DB
      storeProjectRole: storeProjectRoleFactory({ db }),
      emitEvent: getEventBus().emit
    })

    const createObject = createObjectFactory({
      storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({
        db: projectDb
      })
    })
    const getStreamCollaborators = getStreamCollaboratorsFactory({ db })
    const getStreamBranchByName = getStreamBranchByNameFactory({ db: projectDb })
    const downloadProject = downloadProjectFactory({
      downloadCommit: downloadCommitFactory({
        getStream,
        getStreamBranchByName,
        getStreamCollaborators,
        getUser,
        createCommitByBranchId,
        createObject,
        getObject,
        createCommentThreadAndNotify,
        createCommentReplyAndNotify
      }),
      createNewProject,
      getUser,
      getStreamBranchByName,
      createBranchAndNotify: createBranchAndNotifyFactory({
        getStreamBranchByName,
        createBranch: createBranchFactory({ db: projectDb }),
        eventEmit: getEventBus().emit
      })
    })
    await downloadProject({ ...argv, regionKey }, { logger })
  }
}

export = command
