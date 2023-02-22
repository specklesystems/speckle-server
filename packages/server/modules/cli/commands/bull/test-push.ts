import { cliLogger } from '@/logging/logging'
import {
  MentionedInCommentData,
  NotificationType
} from '@/modules/notifications/helpers/types'
import { publishNotification } from '@/modules/notifications/services/publication'
import { initializeQueue } from '@/modules/notifications/services/queue'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'test-push [message] [error]',
  describe: 'Push a fake notification onto the queue',
  builder(yargs) {
    return yargs
      .positional('message', {
        describe: 'Random message to push',
        type: 'string',
        default: 'Hello world!'
      })
      .positional('error', {
        describe: 'Whether to throw error in handler, causing a re-queue',
        type: 'boolean',
        default: false
      })
  },
  handler: async (argv) => {
    initializeQueue()

    // we don't want to submit a real mentions payload, this is for testing only
    await publishNotification(NotificationType.MentionedInComment, {
      targetUserId: '123',
      data: {
        text: argv.message,
        timestamp: new Date().toISOString(),
        error: argv.error
      } as unknown as MentionedInCommentData
    })

    cliLogger.info('Queued a fake notification...')
  }
}

export = command
