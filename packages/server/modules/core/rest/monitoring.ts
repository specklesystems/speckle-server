import {
  getServerOrigin,
  isDevEnv,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { Router } from 'express'
import { ExpressAdapter } from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { getActiveQueues } from '@speckle/shared/queue'
import { moduleLogger } from '@/observability/logging'

/**
 * Has to be invoked after all speckle modules are initialized, cause only then we have
 * the full set of Bull queues registered.
 */
export const bullMonitoringRouterFactory = (): Router => {
  const router = Router()
  if (!isDevEnv() && !isTestEnv()) return router

  const relativeUrl = '/monitoring/bull'
  const url = new URL(relativeUrl, getServerOrigin())
  const queues = getActiveQueues()
  moduleLogger.info(
    `Initializing Bull monitoring UI with ${
      Object.keys(queues).length
    } queues at ${url.toString()}`
  )

  const serverAdapter = new ExpressAdapter()
  serverAdapter.setBasePath(relativeUrl)
  createBullBoard({
    serverAdapter,
    queues: Object.values(queues).map((q) => new BullAdapter(q))
  })

  router.use(relativeUrl, serverAdapter.getRouter())

  return router
}
