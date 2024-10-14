import { CommandModule } from 'yargs'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { cliLogger } from '@/logging/logging'
import {
  getStreamCollaboratorsFactory,
  getStreamFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  getBranchByIdFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchByNameFactory,
  getStreamBranchesByNameFactory,
  markCommitBranchUpdatedFactory
} from '@/modules/core/repositories/branches'
import { createObject } from '@/modules/core/services/objects'
import {
  getObjectFactory,
  getStreamObjectsFactory
} from '@/modules/core/repositories/objects'
import {
  createCommentReplyAndNotifyFactory,
  createCommentThreadAndNotifyFactory
} from '@/modules/comments/services/management'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/core/services/commit/viewerResources'
import {
  createCommitFactory,
  getAllBranchCommitsFactory,
  getSpecificBranchCommitsFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getCommentFactory,
  insertCommentLinksFactory,
  insertCommentsFactory,
  markCommentUpdatedFactory,
  markCommentViewedFactory
} from '@/modules/comments/repositories/comments'
import { db } from '@/db/knex'
import { CommentsEmitter } from '@/modules/comments/events/emitter'
import {
  addCommentCreatedActivity,
  addReplyAddedActivity
} from '@/modules/activitystream/services/commentActivity'
import { validateInputAttachmentsFactory } from '@/modules/comments/services/commentTextService'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { createCommitByBranchIdFactory } from '@/modules/core/services/commit/management'
import { VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import { addCommitCreatedActivityFactory } from '@/modules/activitystream/services/commitActivity'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getUserFactory } from '@/modules/core/repositories/users'

const command: CommandModule<
  unknown,
  {
    commitUrl: string
    targetStreamId: string
    branchName: string
    token?: string
    commentAuthorId?: string
  }
> = {
  command: 'commit <commitUrl> <targetStreamId> [branchName] [commentAuthorId]',
  describe: 'Download a commit from an external Speckle server instance',
  builder: {
    commitUrl: {
      describe:
        'Commit URL (e.g. https://speckle.xyz/streams/f0532359ac/commits/98678e2a3d or https://latest.speckle.systems/projects/92b620fb17/models/76fd8a01c8)',
      type: 'string'
    },
    targetStreamId: {
      describe: 'ID of the local stream that should receive the commit',
      type: 'string'
    },
    branchName: {
      describe: 'Stream branch that should receive the commit',
      type: 'string',
      default: 'main'
    },
    token: {
      describe: 'Target server auth token, in case the stream is private',
      type: 'string'
    },
    commentAuthorId: {
      describe:
        'The local user ID that should be used as the author of comments. If not specified, comments wont be pulled',
      type: 'string',
      default: ''
    }
  },
  handler: async (argv) => {
    const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
    const getStream = getStreamFactory({ db })
    const getObject = getObjectFactory({ db })
    const getStreamObjects = getStreamObjectsFactory({ db })
    const markCommentViewed = markCommentViewedFactory({ db })
    const validateInputAttachments = validateInputAttachmentsFactory({
      getBlobs: getBlobsFactory({ db })
    })
    const getBranchLatestCommits = getBranchLatestCommitsFactory({ db })
    const insertComments = insertCommentsFactory({ db })
    const insertCommentLinks = insertCommentLinksFactory({ db })
    const getViewerResourceItemsUngrouped = getViewerResourceItemsUngroupedFactory({
      getViewerResourceGroups: getViewerResourceGroupsFactory({
        getStreamObjects,
        getBranchLatestCommits,
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

    const getUser = getUserFactory({ db })
    const getStreamCollaborators = getStreamCollaboratorsFactory({ db })
    const downloadCommit = downloadCommitFactory({
      getStream,
      getStreamBranchByName: getStreamBranchByNameFactory({ db }),
      getStreamCollaborators,
      getUser,
      createCommitByBranchId,
      createObject,
      getObject,
      createCommentThreadAndNotify,
      createCommentReplyAndNotify
    })

    await downloadCommit(argv, { logger: cliLogger })
  }
}

export = command
