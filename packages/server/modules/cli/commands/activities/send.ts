import { cliLogger } from '@/logging/logging'
import { sendActivityNotifications } from '@/modules/activitystream/services/summary'
import { publishNotification } from '@/modules/notifications/services/publication'
import { initializeQueue } from '@/modules/notifications/services/queue'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'send [days]',
  describe:
    'Send activity summary notifications for the past days specified in the argument.',
  builder(yargs) {
    return yargs.positional('days', {
      describe: 'Number of days to look for activities',
      type: 'number',
      default: 7
    })
  },
  handler: async (argv) => {
    initializeQueue()
    const numberOfDays = argv.days as number
    const end = new Date()
    const start = new Date(end.getTime())
    start.setDate(start.getDate() - numberOfDays)
    await sendActivityNotifications(start, end, publishNotification)
    cliLogger.info('Sent activity notifications')
  }
}

export = command
