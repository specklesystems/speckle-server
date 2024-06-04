import { createStoredAuthCode } from '@/modules/automate/services/executionEngine'
import {
  handleAutomateFunctionCreatorAuthCallback,
  startAutomateFunctionCreatorAuth
} from '@/modules/automate/services/functionManagement'
import { getGenericRedis } from '@/modules/core'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { validateScope, validateServerRole } from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { Roles, Scopes } from '@speckle/shared'
import { Application } from 'express'

export default (app: Application) => {
  app.get(
    '/api/automate/auth/githubapp',
    corsMiddleware(),
    authMiddlewareCreator([
      validateServerRole({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.AutomateFunctions.Write })
    ]),
    async (req, res) => {
      const startAuth = startAutomateFunctionCreatorAuth({
        createStoredAuthCode: createStoredAuthCode({
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
      validateServerRole({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.AutomateFunctions.Write })
    ]),
    async (req, res) => {
      const handleCallback = handleAutomateFunctionCreatorAuthCallback()
      await handleCallback({ req, res })
    }
  )
}
