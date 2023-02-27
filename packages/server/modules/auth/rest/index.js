'use strict'
const cors = require('cors')

const sentry = require(`@/logging/sentryHelper`)

const {
  getApp,
  createAuthorizationCode,
  createAppTokenFromAccessCode,
  refreshAppToken
} = require('../services/apps')
const { validateToken, revokeTokenById } = require(`@/modules/core/services/tokens`)
const { revokeRefreshToken } = require(`@/modules/auth/services/apps`)
const { validateScopes } = require(`@/modules/shared`)
const { InvalidAccessCodeRequestError } = require('@/modules/auth/errors')
const { ForbiddenError } = require('apollo-server-errors')

// TODO: Secure these endpoints!
module.exports = (app) => {
  /*
  Generates an access code for an app.
  TODO: ensure same origin.
   */
  app.get('/auth/accesscode', async (req, res) => {
    try {
      const appId = req.query.appId
      const app = await getApp({ id: appId })

      if (!app) throw new InvalidAccessCodeRequestError('App does not exist.')

      const challenge = req.query.challenge
      const userToken = req.query.token
      if (!challenge) throw new InvalidAccessCodeRequestError('Missing challenge')
      if (!userToken) throw new InvalidAccessCodeRequestError('Missing token')

      // 1. Validate token
      const { valid, scopes, userId } = await validateToken(userToken)
      if (!valid) throw new InvalidAccessCodeRequestError('Invalid token')

      // 2. Validate token scopes
      await validateScopes(scopes, 'tokens:write')

      const ac = await createAuthorizationCode({ appId, userId, challenge })
      return res.redirect(`${app.redirectUrl}?access_code=${ac}`)
    } catch (err) {
      if (
        err instanceof InvalidAccessCodeRequestError ||
        err instanceof ForbiddenError
      ) {
        res.log.info({ err }, 'Invalid access code request error, or Forbidden error.')
        return res.status(400).send(err.message)
      } else {
        sentry({ err })
        res.log.error(err)
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
      sentry({ err })
      res.log.info({ err }, 'Error while trying to generate a new token.')
      return res.status(401).send({ err: err.message })
    }
  })

  /*
  Ensures a user is logged out by invalidating their token and refresh token.
   */
  app.post('/auth/logout', async (req, res) => {
    try {
      const token = req.body.token
      const refreshToken = req.body.refreshToken

      if (!token) throw new Error('Invalid request. No token provided.')
      await revokeTokenById(token)

      if (refreshToken) await revokeRefreshToken({ tokenId: refreshToken })

      return res.status(200).send({ message: 'You have logged out.' })
    } catch (err) {
      sentry({ err })
      res.log.info({ err }, 'Error while trying to logout.')
      return res.status(400).send('Something went wrong while trying to logout.')
    }
  })
}
