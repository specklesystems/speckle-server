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
import type { CommandModule } from 'yargs'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { storeProjectRoleFactory } from '@/modules/core/repositories/projects'
import { db } from '@/db/knex'

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

    logger.info(
      `Cloning stream ${sourceStreamId} into the account of user ${targetUserId}...`
    )
    const { id } = await asMultiregionalOperation(
      ({ emit, mainDb, allDbs }) => {
        const cloneStream = cloneStreamFactory({
          getStream: getStreamFactory({ db: mainDb }),
          getUser: getUserFactory({ db: mainDb }),
          newProjectDb: mainDb,
          sourceProjectDb: mainDb,
          createStream: replicateFactory(allDbs, createStreamFactory),
          insertCommits: insertCommitsFactory({ db: mainDb }),
          getBatchedStreamCommits: getBatchedStreamCommitsFactory({ db: mainDb }),
          insertStreamCommits: insertStreamCommitsFactory({ db: mainDb }),
          getBatchedStreamBranches: getBatchedStreamBranchesFactory({ db: mainDb }),
          insertBranches: insertBranchesFactory({ db: mainDb }),
          getBatchedBranchCommits: getBatchedBranchCommitsFactory({ db: mainDb }),
          insertBranchCommits: insertBranchCommitsFactory({ db: mainDb }),
          getBatchedStreamComments: getBatchedStreamCommentsFactory({ db: mainDb }),
          insertComments: insertCommentsFactory({ db: mainDb }),
          getCommentLinks: getCommentLinksFactory({ db: mainDb }),
          insertCommentLinks: insertCommentLinksFactory({ db: mainDb }),
          emitEvent: emit,
          storeProjectRole: storeProjectRoleFactory({ db: mainDb })
        })

        return cloneStream(targetUserId, sourceStreamId)
      },
      {
        name: 'Clone Stream',
        dbs: [db], // Cloning does not support multiregion
        logger
      }
    )

    logger.info('Cloning successful! New stream ID: ' + id)
  }
}

export = command
