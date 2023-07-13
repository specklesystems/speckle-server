import { isDevEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import * as express from 'express'

module.exports = (app: express.Application) => {
  if (!isDevEnv() && !isTestEnv()) return

  /**
   * Set up server seeding endpoints for E2E tests
   */

  app.post('/e2e/seed', async () => {
    // TODO
  })
}
