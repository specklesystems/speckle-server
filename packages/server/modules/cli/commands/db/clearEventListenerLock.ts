import { CommandModule } from 'yargs'
import { cliLogger } from '@/logging/logging'
import { forceClearLock } from '@/modules/core/utils/dbNotificationListener'

const command: CommandModule = {
  command: 'clear-event-listener-lock',
  describe: 'Force clear the postgres event listener lock irregardless of who owns it',
  handler: async () => {
    cliLogger.info('Clearing event listener lock...')
    await forceClearLock()
    cliLogger.info('...done')
  }
}

export = command
