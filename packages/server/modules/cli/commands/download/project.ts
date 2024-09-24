import { CommandModule } from 'yargs'
import { cliLogger } from '@/logging/logging'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { getStream, getStreamCollaborators } from '@/modules/core/repositories/streams'
import {
  getBranchLatestCommits,
  getStreamBranchByName,
  getStreamBranchesByName
} from '@/modules/core/repositories/branches'
import { getUser } from '@/modules/core/repositories/users'
import { createCommitByBranchId } from '@/modules/core/services/commit/management'
import { createObject } from '@/modules/core/services/objects'
import { getObject, getStreamObjects } from '@/modules/core/repositories/objects'
import {
  createCommentReplyAndNotify,
  createCommentThreadAndNotifyFactory
} from '@/modules/comments/services/management'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { createBranchAndNotify } from '@/modules/core/services/branch/management'
import { CommentsEmitter } from '@/modules/comments/events/emitter'
import { addCommentCreatedActivity } from '@/modules/activitystream/services/commentActivity'
import {
  getAllBranchCommits,
  getSpecificBranchCommits
} from '@/modules/core/repositories/commits'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/core/services/commit/viewerResources'
import { db } from '@/db/knex'
import {
  insertCommentLinksFactory,
  insertCommentsFactory,
  markCommentViewedFactory
} from '@/modules/comments/repositories/comments'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { validateInputAttachmentsFactory } from '@/modules/comments/services/commentTextService'

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
    const markCommentViewed = markCommentViewedFactory({ db })
    const validateInputAttachments = validateInputAttachmentsFactory({
      getBlobs: getBlobsFactory({ db })
    })
    const insertComments = insertCommentsFactory({ db })
    const insertCommentLinks = insertCommentLinksFactory({ db })
    const getViewerResourceItemsUngrouped = getViewerResourceItemsUngroupedFactory({
      getViewerResourceGroups: getViewerResourceGroupsFactory({
        getStreamObjects,
        getBranchLatestCommits,
        getStreamBranchesByName,
        getSpecificBranchCommits,
        getAllBranchCommits
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
      createBranchAndNotify
    })
    await downloadProject(argv, { logger: cliLogger })
  }
}

export = command
