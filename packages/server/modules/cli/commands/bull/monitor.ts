import { CommandModule } from 'yargs'
import express from 'express'
import { ExpressAdapter } from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import {
  NOTIFICATIONS_QUEUE,
  buildNotificationsQueue
} from '@/modules/notifications/services/queue'
import { noop } from 'lodash'
import { cliLogger } from '@/logging/logging'

const PORT = 3032

const command: CommandModule<unknown, { testQueueId: string }> = {
  command: 'monitor [testQueueId]',
  describe: 'Run bull-board monitoring web UI',
  builder: {
    testQueueId: {
      describe:
        'Optionally specify the ID of a test queue (from a test run) to load it as well',
      type: 'string'
    }
  },
  handler: async (argv) => {
    const testQueueId = argv.testQueueId

    cliLogger.info('Initializing bull queues...')
    const queues = [buildNotificationsQueue(NOTIFICATIONS_QUEUE)]

    if (testQueueId) {
      cliLogger.info('Also initializing queue %s...', testQueueId)
      queues.push(buildNotificationsQueue(testQueueId))
    }

    cliLogger.info('Initializing monitor...')
    const app = express()
    const serverAdapter = new ExpressAdapter()

    createBullBoard({
      serverAdapter,
      queues: Object.values(queues).map((q) => new BullAdapter(q))
    })

    app.use(serverAdapter.getRouter())

    app.listen(PORT, () => {
      cliLogger.info(`Running on ${PORT}...`)
      cliLogger.info(
        `For the UI, open http://127.0.0.1:${PORT}/, and make sure Redis is running`
      )
    })

    // Waiting forever
    await new Promise(noop)
  }
}

export = command
