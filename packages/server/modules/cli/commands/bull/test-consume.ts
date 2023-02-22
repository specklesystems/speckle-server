import { cliLogger } from '@/logging/logging'
import { NotificationType } from '@/modules/notifications/helpers/types'
import { initializeConsumption } from '@/modules/notifications/index'
import { get, noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'test-consume',
  describe: 'Consume incoming messages inserted through test-push',
  handler: async () => {
    cliLogger.info('Starting consumption...')

    // Overriding handler for test purposes, we don't want the actual mentions logic to run
    await initializeConsumption({
      [NotificationType.MentionedInComment]: async (msg, { logger, job }) => {
        logger.info('Received test message with payload', msg, job)

        if (get(msg.data, 'error')) {
          throw new Error('Forced to throw error!')
        }
      }
    })

    // Prevent script from exiting
    await new Promise(noop)
  }
}

export = command
