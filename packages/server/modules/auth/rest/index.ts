import cors from 'cors'
import {
  createBareToken,
  createAppTokenFactory,
  validateTokenFactory
} from '@/modules/core/services/tokens'
import { validateScopes } from '@/modules/shared'
import { InvalidAccessCodeRequestError } from '@/modules/auth/errors'
import { ensureError, Optional, Scopes } from '@speckle/shared'
import { ForbiddenError } from '@/modules/shared/errors'
import {
  getAppFactory,
  revokeRefreshTokenFactory,
  createAuthorizationCodeFactory,
  getAuthorizationCodeFactory,
  deleteAuthorizationCodeFactory,
  createRefreshTokenFactory,
  getRefreshTokenFactory,
  getTokenAppInfoFactory
} from '@/modules/auth/repositories/apps'
import { db } from '@/db/knex'
import {
  createAppTokenFromAccessCodeFactory,
  refreshAppTokenFactory
} from '@/modules/auth/services/serverApps'
import { Express } from 'express'
import {
  getApiTokenByIdFactory,
  getTokenResourceAccessDefinitionsByIdFactory,
  getTokenScopesByIdFactory,
  revokeTokenByIdFactory,
  revokeUserTokenByIdFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory,
  updateApiTokenFactory
} from '@/modules/core/repositories/tokens'
import { getUserRoleFactory } from '@/modules/core/repositories/users'

// TODO: Secure these endpoints!
export default function (app: Express) {
  /*
  Generates an access code for an app.
  TODO: ensure same origin.
   */
  app.get('/auth/accesscode', async (req, res) => {
    try {
      const getApp = getAppFactory({ db })
      const createAuthorizationCode = createAuthorizationCodeFactory({ db })
      const validateToken = validateTokenFactory({
        revokeUserTokenById: revokeUserTokenByIdFactory({ db }),
        getApiTokenById: getApiTokenByIdFactory({ db }),
        getTokenAppInfo: getTokenAppInfoFactory({ db }),
        getTokenScopesById: getTokenScopesByIdFactory({ db }),
        getUserRole: getUserRoleFactory({ db }),
        getTokenResourceAccessDefinitionsById:
          getTokenResourceAccessDefinitionsByIdFactory({ db }),
        updateApiToken: updateApiTokenFactory({ db })
      })

      const preventRedirect = !!req.query.preventRedirect
      const appId = req.query.appId as Optional<string>
      if (!appId)
        throw new InvalidAccessCodeRequestError('appId missing from querystring.')

      const app = await getApp({ id: appId })

      if (!app) throw new InvalidAccessCodeRequestError('App does not exist.')

      const challenge = req.query.challenge as Optional<string>
      const userToken = req.query.token as Optional<string>
      if (!challenge) throw new InvalidAccessCodeRequestError('Missing challenge')
      if (!userToken) throw new InvalidAccessCodeRequestError('Missing token')

      // 1. Validate token
      const tokenValidationResult = await validateToken(userToken)
      const { valid, scopes, userId } =
        'scopes' in tokenValidationResult
          ? tokenValidationResult
          : { ...tokenValidationResult, scopes: [], userId: null }
      if (!valid) throw new InvalidAccessCodeRequestError('Invalid token')

      // 2. Validate token scopes
      await validateScopes(scopes, Scopes.Tokens.Write)

      const ac = await createAuthorizationCode({ appId, userId, challenge })

      const redirectUrl = `${app.redirectUrl}?access_code=${ac}`
      return preventRedirect
        ? res.status(200).json({ redirectUrl })
        : res.redirect(redirectUrl)
    } catch (err) {
      if (
        err instanceof InvalidAccessCodeRequestError ||
        err instanceof ForbiddenError
      ) {
        req.log.info({ err }, 'Invalid access code request error, or Forbidden error.')
        return res.status(400).send(err.message)
      } else {
        req.log.error(err)
        return res
          .status(500)
          .send('Something went wrong while processing your request')
      }
    }
  })

  /*
  Generates a new api token: (1) either via a valid refresh token or (2) via a valid access token
   */
  app.options('/auth/token', cors())
  app.post('/auth/token', cors(), async (req, res) => {
    try {
      const createRefreshToken = createRefreshTokenFactory({ db })
      const getApp = getAppFactory({ db })
      const createAppToken = createAppTokenFactory({
        storeApiToken: storeApiTokenFactory({ db }),
        storeTokenScopes: storeTokenScopesFactory({ db }),
        storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory(
          {
            db
          }
        ),
        storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
      })
      const createAppTokenFromAccessCode = createAppTokenFromAccessCodeFactory({
        getAuthorizationCode: getAuthorizationCodeFactory({ db }),
        deleteAuthorizationCode: deleteAuthorizationCodeFactory({ db }),
        getApp,
        createRefreshToken,
        createAppToken,
        createBareToken
      })
      const refreshAppToken = refreshAppTokenFactory({
        getRefreshToken: getRefreshTokenFactory({ db }),
        revokeRefreshToken: revokeRefreshTokenFactory({ db }),
        createRefreshToken,
        getApp,
        createAppToken,
        createBareToken
      })

      // Token refresh
      if (req.body.refreshToken) {
        if (!req.body.appId || !req.body.appSecret)
          throw new Error('Invalid request - App Id and Secret are required.')

        const authResponse = await refreshAppToken({
          refreshToken: req.body.refreshToken,
          appId: req.body.appId,
          appSecret: req.body.appSecret
        })
        return res.send(authResponse)
      }

      // Access-code - token exchange
      if (
        !req.body.appId ||
        !req.body.appSecret ||
        !req.body.accessCode ||
        !req.body.challenge
      )
        throw new Error(
          `Invalid request, insufficient information provided in the request. App Id, Secret, Access Code, and Challenge are required.`
        )

      const authResponse = await createAppTokenFromAccessCode({
        appId: req.body.appId,
        appSecret: req.body.appSecret,
        accessCode: req.body.accessCode,
        challenge: req.body.challenge
      })
      return res.send(authResponse)
    } catch (err) {
      req.log.info({ err }, 'Error while trying to generate a new token.')
      return res.status(401).send({ err: ensureError(err).message })
    }
  })

  /*
  Ensures a user is logged out by invalidating their token and refresh token.
   */
  app.post('/auth/logout', async (req, res) => {
    try {
      const revokeRefreshToken = revokeRefreshTokenFactory({ db })
      const revokeTokenById = revokeTokenByIdFactory({ db })

      const token = req.body.token
      const refreshToken = req.body.refreshToken

      if (!token) throw new Error('Invalid request. No token provided.')
      await revokeTokenById(token)

      if (refreshToken) await revokeRefreshToken({ tokenId: refreshToken })

      return res.status(200).send({ message: 'You have logged out.' })
    } catch (err) {
      req.log.info({ err }, 'Error while trying to logout.')
      return res.status(400).send('Something went wrong while trying to logout.')
    }
  })
}
