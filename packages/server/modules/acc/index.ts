/* eslint-disable camelcase */
import { createAccOidcFlow } from '@/modules/acc/oidcHelper'
import { registerAccWebhook } from '@/modules/acc/webhook'
import { sessionMiddlewareFactory } from '@/modules/auth/middleware'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import { Express } from 'express'

export default function accRestApi(app: Express) {
  const sessionMiddleware = sessionMiddlewareFactory()
  app.post('/auth/acc/login', sessionMiddleware, async (req, res) => {
    const { projectId } = req.body
    req.session.projectId = projectId

    const accFlow = createAccOidcFlow()
    const { codeVerifier, codeChallenge } = accFlow.generateCodeVerifier()
    req.session.codeVerifier = codeVerifier

    const authorizeUrl = accFlow.buildAuthorizeUrl({
      clientId: process.env.ACC_CLIENT_ID ?? '',
      redirectUri: process.env.ACC_REDIRECT_URL ?? '',
      codeChallenge,
      scopes: [
        'user-profile:read',
        'data:read',
        'data:create',
        'viewables:read',
        'openid'
      ]
    })

    return res.json({ authorizeUrl })
  })

  app.get('/auth/acc/callback', sessionMiddleware, async (req, res) => {
    const { code } = req.query
    const codeVerifier = req.session.codeVerifier

    if (!code || !codeVerifier) {
      return res.status(400).send({ error: 'Missing code or verifier' })
    }

    const accFlow = createAccOidcFlow()
    try {
      const tokens = await accFlow.exchangeCodeForTokens({
        code: String(code),
        codeVerifier,
        clientId: process.env.ACC_CLIENT_ID ?? '',
        clientSecret: process.env.ACC_CLIENT_SECRET ?? '',
        redirectUri: process.env.ACC_REDIRECT_URL ?? ''
      })

      req.session.accTokens = tokens

      return res.redirect(`/projects/${req.session.projectId}/acc`)
    } catch (error) {
      console.error('Token exchange failed:', error)
      return res.status(500).send({ error: 'Token exchange failed' })
    }
  })

  app.get('/auth/acc/status', sessionMiddleware, (req, res) => {
    if (!req.session.accTokens) {
      return res.status(404).send({ error: 'No ACC tokens found' })
    }
    res.send(req.session.accTokens)
  })

  app.post('/auth/acc/refresh', sessionMiddleware, async (req, res) => {
    const { refresh_token } = req.session.accTokens || {}
    if (!refresh_token) {
      return res.status(401).json({ error: 'No refresh token found' })
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ACC_CLIENT_ID ?? '',
        client_secret: process.env.ACC_CLIENT_SECRET ?? '',
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
  })

  app.post('/acc/sync-item-created', sessionMiddleware, async (req, res) => {
    const { accHubUrn } = req.body
    console.log(req.body)
    console.log(accHubUrn)

    if (!req.session.accTokens) {
      throw new Error('whatever')
    }
    const { access_token } = req.session.accTokens
    await registerAccWebhook({
      accessToken: access_token,
      hubUrn: accHubUrn,
      region: 'EMEA',
      event: ''
    })
    res.status(200)
  })

  app.post('/acc/webhook/callback', sessionMiddleware, async (req, res) => {
    console.log(req.body)
    res.status(200)
  })
}

export const init: SpeckleModule['init'] = async ({ app }) => {
  moduleLogger.info('🔑 Init acc module')

  // Hoist rest
  accRestApi(app)
}

export const finalize: SpeckleModule['finalize'] = async () => {}
