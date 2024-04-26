/* eslint-disable camelcase */
import { setUserGithubAuthData } from '@/modules/automate/repositories/automations'
import { getAccessToken, testAccessToken } from '@/modules/core/clients/github'
import { BadVerificationCodeError } from '@/modules/core/errors/github'
import { authorizeUserWithGithubApp } from '@/modules/core/services/githubApp'
import { validateScope, validateServerRole } from '@/modules/shared/authz'
import {
  getAutomateGithubClientInfo,
  getFrontendOrigin
} from '@/modules/shared/helpers/envHelper'
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

      const { id, secret } = getAutomateGithubClientInfo()

      const auth = authorizeUserWithGithubApp({
        setUserGithubAuth: setUserGithubAuthData,
        getGithubAccessToken: getAccessToken,
        testGithubAccessToken: testAccessToken,
        env: {
          clientId: id,
          clientSecret: secret
        }
      })

      try {
        await auth({ code, userId })
        redirectUrl.searchParams.set('ghAuth', 'success')
        return res.redirect(redirectUrl.toString())
      } catch (e) {
        if (e instanceof BadVerificationCodeError) {
          redirectUrl.searchParams.set('ghAuth', 'error')
          redirectUrl.searchParams.set('ghAuthDesc', 'Bad verification code')

          return res.redirect(redirectUrl.toString())
        }

        throw e
      }
    }
  )
}
