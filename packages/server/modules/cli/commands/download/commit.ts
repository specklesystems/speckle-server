import { CommandModule } from 'yargs'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { cliLogger } from '@/logging/logging'
import { getStream, getStreamCollaborators } from '@/modules/core/repositories/streams'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { getUser } from '@/modules/core/repositories/users'
import { createCommitByBranchId } from '@/modules/core/services/commit/management'
import { createObject } from '@/modules/core/services/objects'
import { getObject } from '@/modules/core/repositories/objects'
import {
  createCommentReplyAndNotify,
  createCommentThreadAndNotify
} from '@/modules/comments/services/management'

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
    const downloadCommit = downloadCommitFactory({
      getStream,
      getStreamBranchByName,
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
