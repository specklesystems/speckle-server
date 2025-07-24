import { db } from '@/db/knex'
import { createStoredAuthCodeFactory } from '@/modules/automate/services/authCode'
import {
  handleAutomateFunctionCreatorAuthCallbackFactory,
  startAutomateFunctionCreatorAuthFactory
} from '@/modules/automate/services/functionManagement'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import { validateScope, validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { Roles, Scopes } from '@speckle/shared'
import type { Application } from 'express'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { sessionMiddlewareFactory } from '@/modules/auth/middleware'

export default (app: Application) => {
  app.get(
    '/api/automate/auth/githubapp',
    sessionMiddlewareFactory(),
    corsMiddlewareFactory(),
    authMiddlewareCreator([
      validateServerRoleBuilderFactory({
        getRoles: getRolesFactory({ db })
      })({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.AutomateFunctions.Write })
    ]),
    validateRequest({
      query: z.object({
        workspaceSlug: z.string().optional()
      })
    }),
    async (req, res) => {
      req.session.workspaceSlug = req.query.workspaceSlug

      const startAuth = startAutomateFunctionCreatorAuthFactory({
        createStoredAuthCode: createStoredAuthCodeFactory({
          redis: getGenericRedis()
        })
      })
      await startAuth({ req, res })
    }
  )

  app.get(
    '/api/automate/ghAuthComplete',
    sessionMiddlewareFactory(),
    corsMiddlewareFactory(),
    authMiddlewareCreator([
      validateServerRoleBuilderFactory({
        getRoles: getRolesFactory({ db })
      })({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.AutomateFunctions.Write })
    ]),
    async (req, res) => {
      const handleCallback = handleAutomateFunctionCreatorAuthCallbackFactory()
      await handleCallback({ req, res })
    }
  )
}
