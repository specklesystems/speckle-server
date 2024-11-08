import { db } from '@/db/knex'
import { createStoredAuthCodeFactory } from '@/modules/automate/services/authCode'
import {
  handleAutomateFunctionCreatorAuthCallbackFactory,
  startAutomateFunctionCreatorAuthFactory
} from '@/modules/automate/services/functionManagement'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { validateScope, validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { Roles, Scopes } from '@speckle/shared'
import { Application } from 'express'

export default (app: Application) => {
  app.get(
    '/api/automate/auth/githubapp',
    corsMiddleware(),
    authMiddlewareCreator([
      validateServerRoleBuilderFactory({
        getRoles: getRolesFactory({ db })
      })({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.AutomateFunctions.Write })
    ]),
    async (req, res) => {
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
    corsMiddleware(),
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
