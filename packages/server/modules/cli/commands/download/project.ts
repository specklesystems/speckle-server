import { CommandModule } from 'yargs'
import { cliLogger } from '@/logging/logging'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import {
  createStreamFactory,
  getStreamCollaboratorsFactory,
  getStreamFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  createBranchFactory,
  getBranchByIdFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchByNameFactory,
  getStreamBranchesByNameFactory,
  markCommitBranchUpdatedFactory
} from '@/modules/core/repositories/branches'
import { createCommitByBranchIdFactory } from '@/modules/core/services/commit/management'
import { createObject } from '@/modules/core/services/objects'
import {
  getObjectFactory,
  getStreamObjectsFactory
} from '@/modules/core/repositories/objects'
import {
  createCommentReplyAndNotifyFactory,
  createCommentThreadAndNotifyFactory
} from '@/modules/comments/services/management'
import { createBranchAndNotifyFactory } from '@/modules/core/services/branch/management'
import { CommentsEmitter } from '@/modules/comments/events/emitter'
import {
  addCommentCreatedActivity,
  addReplyAddedActivity
} from '@/modules/activitystream/services/commentActivity'
import {
  createCommitFactory,
  getAllBranchCommitsFactory,
  getSpecificBranchCommitsFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/core/services/commit/viewerResources'
import { db } from '@/db/knex'
import {
  getCommentFactory,
  insertCommentLinksFactory,
  insertCommentsFactory,
  markCommentUpdatedFactory,
  markCommentViewedFactory
} from '@/modules/comments/repositories/comments'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { validateInputAttachmentsFactory } from '@/modules/comments/services/commentTextService'
import { addBranchCreatedActivity } from '@/modules/activitystream/services/branchActivity'
import { VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import { createStreamReturnRecordFactory } from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import { addStreamCreatedActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'
import { addCommitCreatedActivityFactory } from '@/modules/activitystream/services/commitActivity'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'

const command: CommandModule<
  unknown,
  {
    projectUrl: string
    authorId: string
    syncComments: boolean
    token?: string
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
    }
  },
  handler: async (argv) => {
    const getStream = getStreamFactory({ db })
    const getObject = getObjectFactory({ db })
    const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })

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
    const getUsers = getUsersFactory({ db })
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
          getUser
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

    const getStreamCollaborators = getStreamCollaboratorsFactory({ db })
    const getStreamBranchByName = getStreamBranchByNameFactory({ db })
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
      createStreamReturnRecord,
      getUser,
      getStreamBranchByName,
      createBranchAndNotify: createBranchAndNotifyFactory({
        getStreamBranchByName,
        createBranch: createBranchFactory({ db }),
        addBranchCreatedActivity
      })
    })
    await downloadProject(argv, { logger: cliLogger })
  }
}

export = command
