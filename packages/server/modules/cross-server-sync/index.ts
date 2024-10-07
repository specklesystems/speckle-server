import { db } from '@/db/knex'
import { moduleLogger, crossServerSyncLogger } from '@/logging/logging'
import { addBranchCreatedActivity } from '@/modules/activitystream/services/branchActivity'
import {
  addCommentCreatedActivity,
  addReplyAddedActivity
} from '@/modules/activitystream/services/commentActivity'
import { addCommitCreatedActivity } from '@/modules/activitystream/services/commitActivity'
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
import { getObject, getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import {
  getOnboardingBaseStream,
  getStream,
  getStreamCollaborators,
  markCommitStreamUpdated,
  markOnboardingBaseStream
} from '@/modules/core/repositories/streams'
import { getFirstAdmin, getUser } from '@/modules/core/repositories/users'
import { createBranchAndNotifyFactory } from '@/modules/core/services/branch/management'
import { createCommitByBranchIdFactory } from '@/modules/core/services/commit/management'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/core/services/commit/viewerResources'
import { createObject } from '@/modules/core/services/objects'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { ensureOnboardingProjectFactory } from '@/modules/cross-server-sync/services/onboardingProject'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const crossServerSyncModule: SpeckleModule = {
  init() {
    moduleLogger.info('🔄️ Init cross-server-sync module')
  },
  finalize() {
    const getStreamObjects = getStreamObjectsFactory({ db })

    crossServerSyncLogger.info('⬇️  Ensuring base onboarding stream asynchronously...')
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
      addCommitCreatedActivity
    })

    const ensureOnboardingProject = ensureOnboardingProjectFactory({
      getOnboardingBaseStream,
      getFirstAdmin,
      downloadProject: downloadProjectFactory({
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
