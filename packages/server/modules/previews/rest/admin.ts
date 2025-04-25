import { Router } from 'express'
import { db } from '@/db/knex'
import { createBullBoard } from 'bull-board'
import { BullMQAdapter } from 'bull-board/bullMQAdapter'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { Roles } from '@speckle/shared'
import { validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { Queue } from 'bull'

export const adminRouterFactory = (deps: {
  previewRequestQueue: Queue
  previewResponseQueue: Queue
}): Router => {
  const { previewRequestQueue, previewResponseQueue } = deps
  const app = Router()

  const router = createBullBoard([
    new BullMQAdapter(previewRequestQueue),
    new BullMQAdapter(previewResponseQueue)
  ]).router
  app.use(
    '/api/admin/preview-jobs',
    async (req, res, next) => {
      await authMiddlewareCreator([
        validateServerRoleBuilderFactory({ getRoles: getRolesFactory({ db }) })({
          requiredRole: Roles.Server.Admin
        })
      ])(req, res, next)
    },
    router
  )
  return app
}
