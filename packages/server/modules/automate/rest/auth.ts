/* eslint-disable camelcase */
import { validateScope, validateServerRole } from '@/modules/shared/authz'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { Roles, Scopes } from '@speckle/shared'
import { Application } from 'express'

export default (app: Application) => {
  app.get(
    '/api/auth/automate-github-app',
    authMiddlewareCreator([
      validateServerRole({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.AutomateFunctions.Write })
    ]),
    async (req, res) => {
      const userId = req.context.userId
      const { code, error, error_description } = (req.query || {}) as Partial<{
        code: string
        error: string
        error_description: string
      }>
      const redirectUrl = new URL('/functions', getFrontendOrigin())

      if (!code?.length || !userId?.length) {
        redirectUrl.searchParams.set('ghAuth', error || 'unknown')
        redirectUrl.searchParams.set(
          'ghAuthDesc',
          error_description || 'An unknown issue occurred'
        )

        return res.redirect(redirectUrl.toString())
      }

      // TODO: Actually authorize
      redirectUrl.searchParams.set('ghAuth', 'success')

      return res.redirect(redirectUrl.toString())
    }
  )
}
