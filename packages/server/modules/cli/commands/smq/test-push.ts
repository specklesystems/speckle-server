import { NotificationType } from '@/modules/notifications/helpers/types'
import { publishNotification } from '@/modules/notifications/services/publication'
import { initializeQueue } from '@/modules/notifications/services/queue'
import { cliDebug } from '@/modules/shared/utils/logger'
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
    await initializeQueue()
    await publishNotification(NotificationType.Test, {
      targetUserId: '123',
      data: {
        text: argv.message,
        timestamp: new Date().toISOString(),
        error: argv.error
      }
    })

    cliDebug('Queued a fake notification...')
  }
}

export = command
