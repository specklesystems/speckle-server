import { db } from '@/db/knex'
import { moduleLogger, crossServerSyncLogger } from '@/logging/logging'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addBranchCreatedActivityFactory } from '@/modules/activitystream/services/branchActivity'
import {
  addCommentCreatedActivityFactory,
  addReplyAddedActivityFactory
} from '@/modules/activitystream/services/commentActivity'
import { addCommitCreatedActivityFactory } from '@/modules/activitystream/services/commitActivity'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { CommentsEmitter } from '@/modules/comments/events/emitter'
import {
  getCommentFactory,
  getCommentsResourcesFactory,
  insertCommentLinksFactory,
  insertCommentsFactory,
  markCommentUpdatedFactory,
  markCommentViewedFactory
} from '@/modules/comments/repositories/comments'
import { validateInputAttachmentsFactory } from '@/modules/comments/services/commentTextService'
import {
  createCommentReplyAndNotifyFactory,
  createCommentThreadAndNotifyFactory
} from '@/modules/comments/services/management'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import { VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import {
  createBranchFactory,
  getBranchByIdFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchByNameFactory,
  getStreamBranchesByNameFactory,
  markCommitBranchUpdatedFactory
} from '@/modules/core/repositories/branches'
import {
  createCommitFactory,
  getAllBranchCommitsFactory,
  getCommitsAndTheirBranchIdsFactory,
  getSpecificBranchCommitsFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import { storeModelFactory } from '@/modules/core/repositories/models'
import {
  getObjectFactory,
  getStreamObjectsFactory,
  storeClosuresIfNotFoundFactory,
  storeSingleObjectIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import {
  deleteProjectFactory,
  storeProjectFactory,
  storeProjectRoleFactory
} from '@/modules/core/repositories/projects'
import {
  getOnboardingBaseStreamFactory,
  getProjectFactory,
  getStreamCollaboratorsFactory,
  getStreamFactory,
  markCommitStreamUpdatedFactory,
  markOnboardingBaseStreamFactory
} from '@/modules/core/repositories/streams'
import { getFirstAdminFactory, getUserFactory } from '@/modules/core/repositories/users'
import { createBranchAndNotifyFactory } from '@/modules/core/services/branch/management'
import { createCommitByBranchIdFactory } from '@/modules/core/services/commit/management'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory,
  getViewerResourcesForCommentFactory,
  getViewerResourcesForCommentsFactory,
  getViewerResourcesFromLegacyIdentifiersFactory
} from '@/modules/core/services/commit/viewerResources'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import { createNewProjectFactory } from '@/modules/core/services/projects'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { ensureOnboardingProjectFactory } from '@/modules/cross-server-sync/services/onboardingProject'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { publish } from '@/modules/shared/utils/subscriptions'

const crossServerSyncModule: SpeckleModule = {
  init() {
    moduleLogger.info('🔄️ Init cross-server-sync module')
  },
  finalize() {
    crossServerSyncLogger.info('⬇️  Ensuring base onboarding stream asynchronously...')

    // Its fine to use main DB here, none of this is executed in a workspace context
    const getUser = getUserFactory({ db })
    const markOnboardingBaseStream = markOnboardingBaseStreamFactory({ db })
    const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
    const getStream = getStreamFactory({ db })
    const getObject = getObjectFactory({ db })
    const getStreamObjects = getStreamObjectsFactory({ db })
    const markCommentViewed = markCommentViewedFactory({ db })
    const validateInputAttachments = validateInputAttachmentsFactory({
      getBlobs: getBlobsFactory({ db })
    })
    const insertComments = insertCommentsFactory({ db })
    const insertCommentLinks = insertCommentLinksFactory({ db })
    const getViewerResourceItemsUngrouped = getViewerResourceItemsUngroupedFactory({
      getViewerResourceGroups: getViewerResourceGroupsFactory({
        getStreamObjects,
        getBranchLatestCommits: getBranchLatestCommitsFactory({ db }),
        getStreamBranchesByName: getStreamBranchesByNameFactory({ db }),
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
        getAllBranchCommits: getAllBranchCommitsFactory({ db })
      })
    })
    const getViewerResourcesFromLegacyIdentifiers =
      getViewerResourcesFromLegacyIdentifiersFactory({
        getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
          getCommentsResources: getCommentsResourcesFactory({ db }),
          getViewerResourcesFromLegacyIdentifiers: (...args) =>
            getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
        }),
        getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({ db }),
        getStreamObjects
      })
    const createCommentThreadAndNotify = createCommentThreadAndNotifyFactory({
      getViewerResourceItemsUngrouped,
      validateInputAttachments,
      insertComments,
      insertCommentLinks,
      markCommentViewed,
      commentsEventsEmit: CommentsEmitter.emit,
      addCommentCreatedActivity: addCommentCreatedActivityFactory({
        getViewerResourcesFromLegacyIdentifiers,
        getViewerResourceItemsUngrouped,
        saveActivity: saveActivityFactory({ db }),
        publish
      })
    })
    const createCommentReplyAndNotify = createCommentReplyAndNotifyFactory({
      getComment: getCommentFactory({ db }),
      validateInputAttachments,
      insertComments,
      insertCommentLinks,
      markCommentUpdated: markCommentUpdatedFactory({ db }),
      commentsEventsEmit: CommentsEmitter.emit,
      addReplyAddedActivity: addReplyAddedActivityFactory({
        getViewerResourcesForComment: getViewerResourcesForCommentFactory({
          getCommentsResources: getCommentsResourcesFactory({ db }),
          getViewerResourcesFromLegacyIdentifiers
        }),
        saveActivity: saveActivityFactory({ db }),
        publish
      })
    })
    const getStreamBranchByName = getStreamBranchByNameFactory({ db })
    const createCommitByBranchId = createCommitByBranchIdFactory({
      createCommit: createCommitFactory({ db }),
      getObject,
      getBranchById: getBranchByIdFactory({ db }),
      insertStreamCommits: insertStreamCommitsFactory({ db }),
      insertBranchCommits: insertBranchCommitsFactory({ db }),
      markCommitStreamUpdated,
      markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
      versionsEventEmitter: VersionsEmitter.emit,
      addCommitCreatedActivity: addCommitCreatedActivityFactory({
        saveActivity: saveActivityFactory({ db }),
        publish
      })
    })

    const createObject = createObjectFactory({
      storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
      storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
    })

    const createNewProject = createNewProjectFactory({
      storeProject: storeProjectFactory({ db }),
      getProject: getProjectFactory({ db }),
      deleteProject: deleteProjectFactory({ db }),
      storeModel: storeModelFactory({ db }),
      storeProjectRole: storeProjectRoleFactory({ db }),
      projectsEventsEmitter: ProjectsEmitter.emit
    })

    const ensureOnboardingProject = ensureOnboardingProjectFactory({
      getOnboardingBaseStream: getOnboardingBaseStreamFactory({ db }),
      getFirstAdmin: getFirstAdminFactory({ db }),
      downloadProject: downloadProjectFactory({
        downloadCommit: downloadCommitFactory({
          getStream,
          getStreamBranchByName,
          getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
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
          createBranch: createBranchFactory({ db }),
          getStreamBranchByName,
          addBranchCreatedActivity: addBranchCreatedActivityFactory({
            saveActivity: saveActivityFactory({ db }),
            publish
          })
        })
      }),
      markOnboardingBaseStream
    })

    void ensureOnboardingProject().catch((err) =>
      crossServerSyncLogger.error(err, 'Error ensuring onboarding stream')
    )
  }
}

export = crossServerSyncModule
