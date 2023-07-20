import { moduleLogger } from '@/logging/logging'
import { seedViewerE2eTestStream } from '@/modules/core/services/e2e'
import { isDevEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { ensureError } from '@speckle/shared'
import * as express from 'express'

module.exports = (app: express.Application) => {
  if (!isDevEnv() && !isTestEnv()) return

  /**
   * Set up server seeding endpoints for E2E tests
   */

  app.post('/api/e2e/seed', async (_req, res) => {
    try {
      const results = await seedViewerE2eTestStream()
      res.json(results).status(200)
    } catch (e) {
      moduleLogger.error(e)
      res
        .json({ error: ensureError(e).message, stack: ensureError(e).stack })
        .status(500)
    }
  })
}
