import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { Router } from 'express'
import { ExpressAdapter } from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { getActiveQueues } from '@speckle/shared/queue'
import { moduleLogger } from '@/observability/logging'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { db } from '@/db/knex'
import { Roles } from '@speckle/shared'

/**
 * Has to be invoked after all speckle modules are initialized, cause only then we have
 * the full set of Bull queues registered.
 */
export const bullMonitoringRouterFactory = (): Router => {
  const router = Router()

  const relativeUrl = '/api/admin/bull-jobs'
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

  router.use(
    relativeUrl,
    // Admin only
    async (req, res, next) => {
      await authMiddlewareCreator([
        validateServerRoleBuilderFactory({ getRoles: getRolesFactory({ db }) })({
          requiredRole: Roles.Server.Admin
        })
      ])(req, res, next)
    },
    serverAdapter.getRouter()
  )

  return router
}
