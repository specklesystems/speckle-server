import { cloneStream } from '@/modules/core/services/streams/clone'
import { cliDebug } from '@/modules/shared/utils/logger'
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
    cliDebug(
      `Cloning stream ${sourceStreamId} into the account of user ${targetUserId}...`
    )
    const { id } = await cloneStream(targetUserId, sourceStreamId)
    cliDebug('Cloning successful! New stream ID: ' + id)
  }
}

export = command
