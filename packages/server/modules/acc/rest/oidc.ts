/* eslint-disable camelcase */

import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  generateCodeVerifier
} from '@/modules/acc/helpers/oidcHelper'
import { sessionMiddlewareFactory } from '@/modules/auth/middleware'
import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import {
  getAutodeskIntegrationClientId,
  getAutodeskIntegrationClientSecret,
  getFrontendOrigin,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import type { Express } from 'express'

export const accOidc = (app: Express) => {
  const corsMiddleware = corsMiddlewareFactory({
    corsConfig: {
      origin: [getServerOrigin(), getFrontendOrigin()],
      credentials: true
    }
  })
  const sessionMiddleware = sessionMiddlewareFactory()

  app.options('/api/v1/acc/auth/login', corsMiddleware)
  app.post(
    '/api/v1/acc/auth/login',
    corsMiddleware,
    sessionMiddleware,
    async (req, res) => {
      const { projectId } = req.body
      req.session.projectId = projectId

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

  app.options('/api/v1/acc/auth/callback', corsMiddleware)
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

        return res.redirect(`/projects/${req.session.projectId}/acc`)
      } catch (error) {
        console.error('Token exchange failed:', error)
        return res.status(500).send({ error: 'Token exchange failed' })
      }
    }
  )

  app.options('/api/v1/acc/auth/status', corsMiddleware)
  app.get('/api/v1/acc/auth/status', corsMiddleware, sessionMiddleware, (req, res) => {
    if (!req.session.accTokens) {
      return res.status(404).send({ error: 'No ACC tokens found' })
    }
    res.send(req.session.accTokens)
  })

  app.options('/api/v1/acc/auth/refresh', corsMiddleware)
  app.post(
    '/api/v1/acc/auth/refresh',
    corsMiddleware,
    sessionMiddleware,
    async (req, res) => {
      const { refresh_token } = req.session.accTokens || {}
      if (!refresh_token) {
        return res.status(401).json({ error: 'No refresh token found' })
      }

      try {
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: getAutodeskIntegrationClientId(),
          client_secret: getAutodeskIntegrationClientSecret(),
          refresh_token
        })

        const response = await fetch(
          'https://developer.api.autodesk.com/authentication/v2/token',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
          }
        )

        if (!response.ok) {
          console.error(await response.text())
          return res.status(500).json({ error: 'Failed to refresh token' })
        }

        const newTokens = await response.json()
        req.session.accTokens = newTokens

        res.json(newTokens)
      } catch (error) {
        console.error('Error refreshing token:', error)
        res.status(500).json({ error: 'Error refreshing token' })
      }
    }
  )
}
