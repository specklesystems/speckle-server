import { CommandModule } from 'yargs'
import express from 'express'
import { ExpressAdapter } from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import {
  NOTIFICATIONS_QUEUE,
  buildNotificationsQueue
} from '@/modules/notifications/services/queue'
import { cliDebug } from '@/modules/shared/utils/logger'
import { noop } from 'lodash'

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

    cliDebug('Initializing bull queues...')
    const queues = [buildNotificationsQueue(NOTIFICATIONS_QUEUE)]

    if (testQueueId) {
      cliDebug('Also initializing queue ' + testQueueId + '...')
      queues.push(buildNotificationsQueue(testQueueId))
    }

    cliDebug('Initializing monitor...')
    const app = express()
    const serverAdapter = new ExpressAdapter()

    createBullBoard({
      serverAdapter,
      queues: Object.values(queues).map((q) => new BullAdapter(q))
    })

    app.use(serverAdapter.getRouter())

    app.listen(PORT, () => {
      cliDebug(`Running on ${PORT}...`)
      cliDebug(
        `For the UI, open http://localhost:${PORT}/, and make sure Redis is running`
      )
    })

    // Waiting forever
    await new Promise(noop)
  }
}

export = command
