'use strict'

const ExpressSession = require('express-session')
const RedisStore = require('connect-redis')(ExpressSession)
const passport = require('passport')

const sentry = require('@/logging/sentryHelper')
const { createAuthorizationCode } = require('./services/apps')
const {
  getFrontendOrigin,
  getMailchimpStatus,
  getMailchimpNewsletterIds,
  getMailchimpOnboardingIds
} = require('@/modules/shared/helpers/envHelper')
const { isSSLServer, getRedisUrl } = require('@/modules/shared/helpers/envHelper')
const { authLogger, logger } = require('@/logging/logging')
const { createRedisClient } = require('@/modules/shared/redis/redis')
const { mixpanel } = require('@/modules/shared/utils/mixpanel')
const {
  addToMailchimpAudience,
  triggerMailchimpCustomerJourney
} = require('./services/mailchimp')
const { getUserById } = require('@/modules/core/services/users')
/**
 * TODO: Get rid of session entirely, we don't use it for the app and it's not really necessary for the auth flow, so it only complicates things
 * NOTE: it does seem used!
 */

module.exports = async (app) => {
  const authStrategies = []

  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => done(null, user))
  app.use(passport.initialize())

  const redisClient = createRedisClient(getRedisUrl())
  const session = ExpressSession({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 3, // 3 minutes
      secure: isSSLServer()
    }
  })

  /**
   * Move incoming auth query params to session, for easier access (?)
   */
  const sessionStorage = (req, res, next) => {
    if (!req.query.challenge)
      return res.status(400).send('Invalid request: no challenge detected.')

    req.session.challenge = req.query.challenge

    const token = req.query.token || req.query.inviteId
    if (token) {
      req.session.token = token
    }

    const newsletterConsent = req.query.newsletter || null
    if (newsletterConsent) {
      req.session.newsletterConsent = true
    }

    next()
  }

  /**
  Finalizes authentication for the main frontend application.
  @param {import('express').Request} req
   */
  const finalizeAuth = async (req, res) => {
    try {
      const ac = await createAuthorizationCode({
        appId: 'spklwebapp',
        userId: req.user.id,
        challenge: req.session.challenge
      })

      let newsletterConsent = false
      if (req.session.newsletterConsent) newsletterConsent = true // NOTE: it's only set if it's true

      if (req.session) req.session.destroy()

      // Resolve redirect URL
      const urlObj = new URL(req.authRedirectPath || '/', getFrontendOrigin())
      urlObj.searchParams.set('access_code', ac)

      if (req.user.isNewUser) {
        urlObj.searchParams.set('register', 'true')

        // Send event to MP
        const userEmail = req.user.email
        const isInvite = !!req.user.isInvite
        if (userEmail) {
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
      sentry({ err })
      authLogger.error(err, 'Could not finalize auth')
      if (req.session) req.session.destroy()
      return res.status(401).send({ err: err.message })
    }
  }

  /*
  Strategies initialisation & listing
  */

  let strategyCount = 0

  if (process.env.STRATEGY_GOOGLE === 'true') {
    const googStrategy = await require('./strategies/google')(
      app,
      session,
      sessionStorage,
      finalizeAuth
    )
    authStrategies.push(googStrategy)
    strategyCount++
  }

  if (process.env.STRATEGY_GITHUB === 'true') {
    const githubStrategy = await require('./strategies/github')(
      app,
      session,
      sessionStorage,
      finalizeAuth
    )
    authStrategies.push(githubStrategy)
    strategyCount++
  }

  if (process.env.STRATEGY_AZURE_AD === 'true') {
    const azureAdStrategy = await require('./strategies/azure-ad')(
      app,
      session,
      sessionStorage,
      finalizeAuth
    )
    authStrategies.push(azureAdStrategy)
    strategyCount++
  }

  if (process.env.STRATEGY_OIDC === 'true') {
    const oidcStrategy = await require('./strategies/oidc')(
      app,
      session,
      sessionStorage,
      finalizeAuth
    )
    authStrategies.push(oidcStrategy)
    strategyCount++
  }

  // Note: always leave the local strategy init for last so as to be able to
  // force enable it in case no others are present.
  if (process.env.STRATEGY_LOCAL === 'true' || strategyCount === 0) {
    const localStrategy = await require('./strategies/local')(
      app,
      session,
      sessionStorage,
      finalizeAuth
    )
    authStrategies.push(localStrategy)
  }

  return authStrategies
}
