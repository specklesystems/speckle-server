import { CommandModule } from 'yargs'
import express from 'express'
import { ExpressAdapter } from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { buildAllPossibleQueues } from '@/modules/notifications/services/queue'
import { cliDebug } from '@/modules/shared/utils/logger'
import { noop } from 'lodash'

const PORT = 3032

const command: CommandModule = {
  command: 'monitor',
  describe: 'Run bull-board monitoring web UI',
  handler: async () => {
    cliDebug('Initializing bull queues...')
    const queues = buildAllPossibleQueues()

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
