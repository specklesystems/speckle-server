import type { RequestHandler } from 'express'
import ExpressSession from 'express-session'
import ConnectRedis from 'connect-redis'
import { createRedisClient } from '@/modules/shared/redis/redis'
import {
  isSSLServer,
  getRedisUrl,
  getFrontendOrigin,
  enableMixpanel,
  getMailchimpStatus,
  getMailchimpOnboardingIds,
  getMailchimpNewsletterIds
} from '@/modules/shared/helpers/envHelper'
import { getSessionSecret } from '@/modules/shared/helpers/envHelper'
import { isString, noop } from 'lodash'
import { CreateAuthorizationCode } from '@/modules/auth/domain/operations'
import { mixpanel } from '@/modules/shared/utils/mixpanel'
import {
  addToMailchimpAudience,
  triggerMailchimpCustomerJourney
} from '@/modules/auth/services/mailchimp'
import { authLogger, logger } from '@/logging/logging'
import { ensureError } from '@speckle/shared'
import { LegacyGetUser } from '@/modules/core/domain/users/operations'

export const sessionMiddlewareFactory = (): RequestHandler => {
  const RedisStore = ConnectRedis(ExpressSession)
  const redisClient = createRedisClient(getRedisUrl(), {})
  const sessionMiddleware = ExpressSession({
    store: new RedisStore({ client: redisClient }),
    secret: getSessionSecret(),
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 3, // 3 minutes
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
  }): RequestHandler =>
  async (req, res) => {
    try {
      if (!req.user) {
        throw new Error('Cannot finalize auth - No user attached to session')
      }

      const ac = await deps.createAuthorizationCode({
        appId: 'spklwebapp',
        userId: req.user.id,
        challenge: req.session.challenge!
      })

      let newsletterConsent = false
      if (req.session.newsletterConsent) newsletterConsent = true // NOTE: it's only set if it's true

      if (req.session) req.session.destroy(noop)

      // Resolve redirect URL
      const urlObj = new URL(req.authRedirectPath || '/', getFrontendOrigin())
      urlObj.searchParams.set('access_code', ac)

      if (req.user.isNewUser) {
        urlObj.searchParams.set('register', 'true')

        // Send event to MP
        const userEmail = req.user.email
        const isInvite = !!req.user.isInvite
        if (userEmail && enableMixpanel()) {
          await mixpanel({ userEmail, req }).track('Sign Up', {
            isInvite
          })
        }

        if (getMailchimpStatus()) {
          try {
            const user = await deps.getUser(req.user.id)
            if (!user)
              throw new Error(
                'Could not register user for mailchimp lists - no db user record found.'
              )
            const onboardingIds = getMailchimpOnboardingIds()
            await triggerMailchimpCustomerJourney(user, onboardingIds)

            if (newsletterConsent) {
              const { listId } = getMailchimpNewsletterIds()
              await addToMailchimpAudience(user, listId)
            }
          } catch (error) {
            logger.warn(error, 'Failed to sign up user to mailchimp lists')
          }
        }
      }

      const redirectUrl = urlObj.toString()

      return res.redirect(redirectUrl)
    } catch (err) {
      authLogger.error(err, 'Could not finalize auth')
      if (req.session) req.session.destroy(noop)
      return res.status(401).send({
        err: ensureError(err, 'Unexpected issue arose while finalizing auth').message
      })
    }
  }
