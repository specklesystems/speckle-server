import { db } from '@/db/knex'
import { createStoredAuthCodeFactory } from '@/modules/automate/services/authCode'
import {
  handleAutomateFunctionCreatorAuthCallbackFactory,
  startAutomateFunctionCreatorAuthFactory
} from '@/modules/automate/services/functionManagement'
import { getGenericRedis } from '@/modules/core'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { validateScope, validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { Roles, Scopes } from '@speckle/shared'
import { Application } from 'express'
import { HttpMethod, OpenApiDocument } from '@/modules/shared/helpers/typeHelper'

export default (params: { app: Application; openApiDocument: OpenApiDocument }) => {
  const { app, openApiDocument } = params
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
  openApiDocument.registerOperation('/api/automate/auth/githubapp', HttpMethod.GET, {
    summary: 'Start GitHub App OAuth flow',
    description: 'Start GitHub App OAuth flow',
    responses: {
      302: {
        description: 'Redirects to GitHub to start authentication.'
      }
    }
  })

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

  openApiDocument.registerOperation('/api/automate/ghAuthComplete', HttpMethod.GET, {
    summary: 'Complete GitHub App OAuth flow',
    description: 'Complete GitHub App OAuth flow',
    responses: {
      302: {
        description:
          'Handles the callback from the GitHub authentication flow, redirecting to the relevant page based on the GitHub response.'
      }
    }
  })
}
