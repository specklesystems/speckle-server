import { db } from '@/db/knex'
import { cliLogger as logger } from '@/observability/logging'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import {
  getBatchedStreamBranchesFactory,
  insertBranchesFactory
} from '@/modules/core/repositories/branches'
import {
  getBatchedBranchCommitsFactory,
  getBatchedStreamCommitsFactory,
  insertBranchCommitsFactory,
  insertCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  createStreamFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { cloneStreamFactory } from '@/modules/core/services/streams/clone'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { CommandModule } from 'yargs'

const command: CommandModule<
  unknown,
  { sourceStreamId: string; targetUserId: string }
> = {
  command: 'clone <sourceStreamId> <targetUserId>',
  describe: 'Clone a source stream to the account of the target user',
  builder: {
    sourceStreamId: {
      describe: 'ID of the stream that will be cloned',
      type: 'string'
    },
    targetUserId: {
      describe: 'ID of the user who will be marked as the author of the cloned stream',
      type: 'string'
    }
  },
  handler: async (argv) => {
    const { sourceStreamId, targetUserId } = argv

    const getUser = getUserFactory({ db })
    const cloneStream = cloneStreamFactory({
      getStream: getStreamFactory({ db }),
      getUser,
      newProjectDb: db,
      sourceProjectDb: db,
      createStream: createStreamFactory({ db }),
      insertCommits: insertCommitsFactory({ db }),
      getBatchedStreamCommits: getBatchedStreamCommitsFactory({ db }),
      insertStreamCommits: insertStreamCommitsFactory({ db }),
      getBatchedStreamBranches: getBatchedStreamBranchesFactory({ db }),
      insertBranches: insertBranchesFactory({ db }),
      getBatchedBranchCommits: getBatchedBranchCommitsFactory({ db }),
      insertBranchCommits: insertBranchCommitsFactory({ db }),
      getBatchedStreamComments: getBatchedStreamCommentsFactory({ db }),
      insertComments: insertCommentsFactory({ db }),
      getCommentLinks: getCommentLinksFactory({ db }),
      insertCommentLinks: insertCommentLinksFactory({ db }),
      emitEvent: getEventBus().emit
    })

    logger.info(
      `Cloning stream ${sourceStreamId} into the account of user ${targetUserId}...`
    )
    const { id } = await cloneStream(targetUserId, sourceStreamId)
    logger.info('Cloning successful! New stream ID: ' + id)
  }
}

export default command
