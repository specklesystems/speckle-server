/* eslint-disable camelcase */

import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  exchangeRefreshTokenForTokens,
  generateCodeVerifier
} from '@/modules/acc/clients/autodesk'
import { sessionMiddlewareFactory } from '@/modules/auth/middleware'
import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import {
  getAutodeskIntegrationClientId,
  getAutodeskIntegrationClientSecret,
  getBentleyIntegrationClientId,
  getBentleyIntegrationClientSecret,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import { logger } from '@/observability/logging'
import type { Express } from 'express'

export const setupAccOidcEndpoints = (app: Express) => {
  const corsMiddleware = corsMiddlewareFactory()
  const sessionMiddleware = sessionMiddlewareFactory()

  app.post(
    '/api/v1/acc/auth/login',
    corsMiddleware,
    sessionMiddleware,
    async (req, res) => {
      const { callbackEndpoint } = req.body
      req.session.callbackEndpoint = callbackEndpoint

      const { codeVerifier, codeChallenge } = generateCodeVerifier()
      req.session.codeVerifier = codeVerifier

      const redirectUri = `${getServerOrigin()}/api/v1/acc/auth/callback`

      const authorizeUrl = buildAuthorizeUrl({
        clientId: getAutodeskIntegrationClientId(),
        redirectUri,
        codeChallenge,
        scopes: ['user-profile:read', 'data:read', 'viewables:read', 'openid']
      })

      return res.json({ authorizeUrl })
    }
  )

  app.post(
    '/api/v1/bentley-itwin/auth/login',
    corsMiddleware,
    sessionMiddleware,
    async (req, res) => {
      const { callbackEndpoint } = req.body
      req.session.callbackEndpoint = callbackEndpoint

      const { codeVerifier, codeChallenge } = generateCodeVerifier()
      req.session.codeVerifier = codeVerifier

      const redirectUri = `${getServerOrigin()}/api/v1/bentley-itwin/auth/callback`

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: 'webapp-5kI0vnmUtHXmryVDgn02uSALB',
        redirect_uri: redirectUri,
        scope: 'itwin-platform offline_access'
      })

      const authorizeUrl = `https://ims.bentley.com/connect/authorize?${params.toString()}`

      return res.json({ authorizeUrl })
    }
  )

  app.get(
    '/api/v1/bentley-itwin/auth/callback',
    corsMiddleware,
    sessionMiddleware,
    async (req, res) => {
      const { code } = req.query
      const codeVerifier = req.session.codeVerifier

      if (!code || !codeVerifier) {
        return res.status(400).send({ error: 'Missing code or verifier' })
      }

      try {
        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: getBentleyIntegrationClientId(),
          client_secret: getBentleyIntegrationClientSecret(),
          redirect_uri: `${getServerOrigin()}/api/v1/bentley-itwin/auth/callback`,
          code: String(code)
        })

        const response = await fetch('https://ims.bentley.com/connect/token', {
          method: 'POST',
          body: params,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        const data = await response.json()

        req.session.bentleyTokens = data

        logger.warn(req.session)

        if (!req.session.callbackEndpoint) {
          return res.status(500)
        }

        return res.redirect(req.session.callbackEndpoint)
      } catch (error) {
        console.error('Token exchange failed:', error)
        return res.status(500).send({ error: 'Token exchange failed' })
      }
    }
  )

  app.get(
    '/api/v1/acc/auth/callback',
    corsMiddleware,
    sessionMiddleware,
    async (req, res) => {
      const { code } = req.query
      const codeVerifier = req.session.codeVerifier

      if (!code || !codeVerifier) {
        return res.status(400).send({ error: 'Missing code or verifier' })
      }

      try {
        const tokens = await exchangeCodeForTokens({
          code: String(code),
          codeVerifier,
          clientId: getAutodeskIntegrationClientId(),
          clientSecret: getAutodeskIntegrationClientSecret(),
          redirectUri: `${getServerOrigin()}/api/v1/acc/auth/callback`
        })

        req.session.accTokens = tokens

        logger.warn(req.session)

        if (!req.session.callbackEndpoint) {
          return res.status(500)
        }

        return res.redirect(req.session.callbackEndpoint)
      } catch (error) {
        console.error('Token exchange failed:', error)
        return res.status(500).send({ error: 'Token exchange failed' })
      }
    }
  )

  app.get('/api/v1/acc/auth/status', corsMiddleware, sessionMiddleware, (req, res) => {
    try {
      if (!req.session.accTokens) {
        return res.status(404).send({ error: 'No ACC tokens found' })
      }
      res.send(req.session.accTokens)
    } finally {
      req.session.accTokens = undefined // we wanna return it just once
    }
  })

  app.get(
    '/api/v1/bentley-itwin/auth/status',
    corsMiddleware,
    sessionMiddleware,
    (req, res) => {
      try {
        if (!req.session.bentleyTokens) {
          return res.status(404).send({ error: 'No Bentley tokens found' })
        }
        res.send(req.session.bentleyTokens)
      } finally {
        req.session.bentleyTokens = undefined // we wanna return it just once
      }
    }
  )

  app.post(
    '/api/v1/acc/auth/refresh',
    corsMiddleware,
    sessionMiddleware,
    async (req, res) => {
      const { refresh_token } = req.body || {}
      if (!refresh_token) {
        return res.status(401).json({ error: 'No refresh token found' })
      }

      try {
        const newTokens = await exchangeRefreshTokenForTokens({ refresh_token })
        req.session.accTokens = newTokens
        res.json(newTokens)
      } catch (error) {
        console.error('Error refreshing token:', error)
        res.status(500).json({ error })
      }
    }
  )
}
