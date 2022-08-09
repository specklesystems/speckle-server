import { NotificationType } from '@/modules/notifications/helpers/types'
import { initializeConsumption } from '@/modules/notifications/index'
import { cliDebug } from '@/modules/shared/utils/logger'
import { noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'test-consume',
  describe: 'Consume incoming messages inserted through test-push',
  handler: async () => {
    cliDebug('Starting consumption...')
    await initializeConsumption([NotificationType.Test])

    // Prevent script from exiting
    await new Promise(noop)
  }
}

export = command
