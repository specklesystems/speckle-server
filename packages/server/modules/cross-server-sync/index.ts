import { db } from '@/db/knex'
import { moduleLogger, crossServerSyncLogger } from '@/logging/logging'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addBranchCreatedActivity } from '@/modules/activitystream/services/branchActivity'
import {
  addCommentCreatedActivity,
  addReplyAddedActivity
} from '@/modules/activitystream/services/commentActivity'
import { addCommitCreatedActivityFactory } from '@/modules/activitystream/services/commitActivity'
import { addStreamCreatedActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { CommentsEmitter } from '@/modules/comments/events/emitter'
import {
  getCommentFactory,
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
  getSpecificBranchCommitsFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getObjectFactory,
  getStreamObjectsFactory,
  storeClosuresIfNotFoundFactory,
  storeSingleObjectIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createStreamFactory,
  getOnboardingBaseStreamFactory,
  getStreamCollaboratorsFactory,
  getStreamFactory,
  markCommitStreamUpdatedFactory,
  markOnboardingBaseStreamFactory
} from '@/modules/core/repositories/streams'
import {
  getFirstAdminFactory,
  getUserFactory,
  getUsersFactory
} from '@/modules/core/repositories/users'
import { createBranchAndNotifyFactory } from '@/modules/core/services/branch/management'
import { createCommitByBranchIdFactory } from '@/modules/core/services/commit/management'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/core/services/commit/viewerResources'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import { createStreamReturnRecordFactory } from '@/modules/core/services/streams/management'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { ensureOnboardingProjectFactory } from '@/modules/cross-server-sync/services/onboardingProject'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'

const crossServerSyncModule: SpeckleModule = {
  init() {
    moduleLogger.info('🔄️ Init cross-server-sync module')
  },
  finalize() {
    crossServerSyncLogger.info('⬇️  Ensuring base onboarding stream asynchronously...')

    const getServerInfo = getServerInfoFactory({ db })
    const getUser = getUserFactory({ db })
    const getUsers = getUsersFactory({ db })
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
    const createCommentThreadAndNotify = createCommentThreadAndNotifyFactory({
      getViewerResourceItemsUngrouped,
      validateInputAttachments,
      insertComments,
      insertCommentLinks,
      markCommentViewed,
      commentsEventsEmit: CommentsEmitter.emit,
      addCommentCreatedActivity
    })
    const createCommentReplyAndNotify = createCommentReplyAndNotifyFactory({
      getComment: getCommentFactory({ db }),
      validateInputAttachments,
      insertComments,
      insertCommentLinks,
      markCommentUpdated: markCommentUpdatedFactory({ db }),
      commentsEventsEmit: CommentsEmitter.emit,
      addReplyAddedActivity
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
    const createStreamReturnRecord = createStreamReturnRecordFactory({
      inviteUsersToProject: inviteUsersToProjectFactory({
        createAndSendInvite: createAndSendInviteFactory({
          findUserByTarget: findUserByTargetFactory({ db }),
          insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
          collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
            getStream
          }),
          buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
            getStream
          }),
          emitEvent: ({ eventName, payload }) =>
            getEventBus().emit({
              eventName,
              payload
            }),
          getUser,
          getServerInfo
        }),
        getUsers
      }),
      createStream: createStreamFactory({ db }),
      createBranch: createBranchFactory({ db }),
      addStreamCreatedActivity: addStreamCreatedActivityFactory({
        saveActivity: saveActivityFactory({ db }),
        publish
      }),
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
        createStreamReturnRecord,
        getUser,
        getStreamBranchByName,
        createBranchAndNotify: createBranchAndNotifyFactory({
          createBranch: createBranchFactory({ db }),
          getStreamBranchByName,
          addBranchCreatedActivity
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
