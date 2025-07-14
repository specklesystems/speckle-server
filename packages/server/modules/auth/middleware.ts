import type { RequestHandler } from 'express'
import ExpressSession from 'express-session'
import ConnectRedis from 'connect-redis'
import { createRedisClient } from '@/modules/shared/redis/redis'
import {
  isSSLServer,
  getRedisUrl,
  getFrontendOrigin,
  getSessionSecret
} from '@/modules/shared/helpers/envHelper'
import { isString, noop } from 'lodash-es'
import { CreateAuthorizationCode } from '@/modules/auth/domain/operations'
import { ensureError, TIME_MS } from '@speckle/shared'
import { LegacyGetUser } from '@/modules/core/domain/users/operations'
import { ForbiddenError } from '@/modules/shared/errors'
import { UserInputError } from '@/modules/core/errors/userinput'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { UserEvents } from '@/modules/core/domain/users/events'

export const sessionMiddlewareFactory = (): RequestHandler => {
  const RedisStore = ConnectRedis(ExpressSession)
  const redisClient = createRedisClient(getRedisUrl(), {})
  const sessionMiddleware = ExpressSession({
    store: new RedisStore({ client: redisClient }),
    secret: getSessionSecret(),
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 3 * TIME_MS.minute,
      secure: isSSLServer()
    }
  })

  return sessionMiddleware
}

/**
 * Move incoming auth query params to session, for easier access
 */
export const moveAuthParamsToSessionMiddlewareFactory =
  (): RequestHandler => (req, res, next) => {
    if (!req.query.challenge)
      return res.status(400).send('Invalid request: no challenge detected.')

    req.session.challenge =
      req.query.challenge && isString(req.query.challenge)
        ? req.query.challenge
        : undefined

    const token = req.query.token || req.query.inviteId
    if (token && isString(token)) {
      req.session.token = token
    }

    const newsletterConsent = req.query.newsletter || null
    if (newsletterConsent) {
      req.session.newsletterConsent = true
    }

    next()
  }

/**
 * Finalizes authentication for the main frontend application.
 */
export const finalizeAuthMiddlewareFactory =
  (deps: {
    createAuthorizationCode: CreateAuthorizationCode
    getUser: LegacyGetUser
    emitEvent: EventBusEmit
  }): RequestHandler =>
  async (req, res) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Cannot finalize auth - No user attached to session')
      }

      if (res.headersSent) {
        req.log.info(
          'Headers already sent, probably by Passport if prior steps fail; skipping auth finalization'
        )
        return
      }

      const ac = await deps.createAuthorizationCode({
        appId: 'spklwebapp',
        userId: req.user.id,
        challenge: req.session.challenge!
      })

      if (req.session) req.session.destroy(noop)

      // Resolve redirect URL
      const urlObj = new URL(req.authRedirectPath || '/', getFrontendOrigin())
      urlObj.searchParams.set('access_code', ac)

      if (req.user.isNewUser) {
        urlObj.searchParams.set('register', 'true')
      }

      const redirectUrl = urlObj.toString()

      await deps.emitEvent({
        eventName: UserEvents.Authenticated,
        payload: { userId: req.user.id, isNewUser: !!req.user.isNewUser }
      })

      return res.redirect(redirectUrl)
    } catch (err) {
      const e = ensureError(err, 'Unexpected issue arose while finalizing auth')
      switch (e.constructor) {
        case ForbiddenError:
          req.log.debug({ err: e }, 'Could not finalize auth')
          break
        case UserInputError:
          req.log.info({ err: e }, 'Could not finalize auth')
          break
        default:
          req.log.error({ err: e }, 'Could not finalize auth')
          break
      }

      if (req.session) req.session.destroy(noop)
      return res.status(401).send({
        err: e.message
      })
    }
  }
