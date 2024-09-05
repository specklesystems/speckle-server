import ExpressSession from 'express-session'
import ConnectRedis from 'connect-redis'
import passport from 'passport'
import { createAuthorizationCode } from '@/modules/auth/services/apps'
import {
  getFrontendOrigin,
  getMailchimpStatus,
  getMailchimpNewsletterIds,
  getMailchimpOnboardingIds,
  getSessionSecret,
  enableMixpanel
} from '@/modules/shared/helpers/envHelper'
import { isSSLServer, getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { authLogger, logger } from '@/logging/logging'
import { createRedisClient } from '@/modules/shared/redis/redis'
import { mixpanel } from '@/modules/shared/utils/mixpanel'
import {
  addToMailchimpAudience,
  triggerMailchimpCustomerJourney
} from '@/modules/auth/services/mailchimp'
import { getUserById } from '@/modules/core/services/users'
import type { Express, RequestHandler } from 'express'
import {
  AuthStrategyMetadata,
  AuthStrategyPassportUser
} from '@/modules/auth/helpers/types'
import { isString, noop } from 'lodash'
import { ensureError } from '@speckle/shared'

const setupStrategies = async (app: Express) => {
  const authStrategies: AuthStrategyMetadata[] = []

  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => done(null, user as AuthStrategyPassportUser))

  app.use(passport.initialize())

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

  /**
   * Move incoming auth query params to session, for easier access
   */
  const moveAuthParamsToSessionMiddleware: RequestHandler = (req, res, next) => {
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
  const finalizeAuthMiddleware: RequestHandler = async (req, res) => {
    try {
      if (!req.user) {
        throw new Error('Cannot finalize auth - No user attached to session')
      }

      const ac = await createAuthorizationCode({
        appId: 'spklwebapp',
        userId: req.user.id,
        challenge: req.session.challenge
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
            const user = await getUserById({ userId: req.user.id })
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

  /*
   * Strategies initialisation & listing
   */

  let strategyCount = 0

  if (process.env.STRATEGY_GOOGLE === 'true') {
    const googleStrategyBuilder = (await import('@/modules/auth/strategies/google'))
      .default
    const googStrategy = await googleStrategyBuilder(
      app,
      sessionMiddleware,
      moveAuthParamsToSessionMiddleware,
      finalizeAuthMiddleware
    )
    authStrategies.push(googStrategy)
    strategyCount++
  }

  if (process.env.STRATEGY_GITHUB === 'true') {
    const githubStrategyBuilder = (await import('@/modules/auth/strategies/github'))
      .default
    const githubStrategy = await githubStrategyBuilder(
      app,
      sessionMiddleware,
      moveAuthParamsToSessionMiddleware,
      finalizeAuthMiddleware
    )
    authStrategies.push(githubStrategy)
    strategyCount++
  }

  if (process.env.STRATEGY_AZURE_AD === 'true') {
    const azureAdStrategyBuilder = (await import('@/modules/auth/strategies/azureAd'))
      .default
    const azureAdStrategy = await azureAdStrategyBuilder(
      app,
      sessionMiddleware,
      moveAuthParamsToSessionMiddleware,
      finalizeAuthMiddleware
    )
    authStrategies.push(azureAdStrategy)
    strategyCount++
  }

  if (process.env.STRATEGY_OIDC === 'true') {
    const oidcStrategyBuilder = (await import('@/modules/auth/strategies/oidc')).default
    const oidcStrategy = await oidcStrategyBuilder(
      app,
      sessionMiddleware,
      moveAuthParamsToSessionMiddleware,
      finalizeAuthMiddleware
    )
    authStrategies.push(oidcStrategy)
    strategyCount++
  }

  // Note: always leave the local strategy init for last so as to be able to
  // force enable it in case no others are present.
  if (process.env.STRATEGY_LOCAL === 'true' || strategyCount === 0) {
    const localStrategyBuilder = (await import('@/modules/auth/strategies/local'))
      .default
    const localStrategy = await localStrategyBuilder(
      app,
      sessionMiddleware,
      moveAuthParamsToSessionMiddleware,
      finalizeAuthMiddleware
    )
    authStrategies.push(localStrategy)
  }

  return authStrategies
}

export = setupStrategies
