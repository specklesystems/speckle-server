'use strict'

const ExpressSession = require('express-session')
const RedisStore = require('connect-redis')(ExpressSession)
const passport = require('passport')

const sentry = require('@/logging/sentryHelper')
const { createAuthorizationCode } = require('./services/apps')
const { isSSLServer, getRedisUrl } = require('@/modules/shared/helpers/envHelper')
const { authLogger } = require('@/logging/logging')
const { createRedisClient } = require('@/modules/shared/redis/redis')
const { mixpanel, resolveMixpanelUserId } = require('@/modules/shared/utils/mixpanel')

/**
 * TODO: Get rid of session entirely, we don't use it for the app and it's not really necessary for the auth flow, so it only complicates things
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

      if (req.session) req.session.destroy()

      // Resolve redirect URL
      const urlObj = new URL(req.authRedirectPath || '/', process.env.CANONICAL_URL)
      urlObj.searchParams.set('access_code', ac)

      if (req.user.isNewUser) {
        urlObj.searchParams.set('register', 'true')

        // Send event to MP
        const userId = req.user.email ? resolveMixpanelUserId(req.user.email) : null
        const isInvite = !!req.user.isInvite
        if (userId) {
          await mixpanel({ mixpanelUserId: userId }).track('Sign Up', {
            isInvite
          })
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
