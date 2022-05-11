'use strict'

const redis = require('redis')
const ExpressSession = require('express-session')
const RedisStore = require('connect-redis')(ExpressSession)
const passport = require('passport')

const sentry = require('@/logging/sentryHelper')
const { createAuthorizationCode } = require('./services/apps')

module.exports = async (app) => {
  const authStrategies = []

  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => done(null, user))
  app.use(passport.initialize())

  const session = ExpressSession({
    store: new RedisStore({ client: redis.createClient(process.env.REDIS_URL) }),
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 1000 * 60 * 3 } // 3 minutes
  })

  const sessionStorage = (req, res, next) => {
    if (!req.query.challenge)
      return res.status(400).send('Invalid request: no challenge detected.')

    req.session.challenge = req.query.challenge

    if (req.query.suuid) {
      req.session.suuid = req.query.suuid
    }

    if (req.query.inviteId) {
      req.session.inviteId = req.query.inviteId
    }

    next()
  }

  /*
  Finalizes authentication for the main frontend application.
   */
  const finalizeAuth = async (req, res) => {
    try {
      const ac = await createAuthorizationCode({
        appId: 'spklwebapp',
        userId: req.user.id,
        challenge: req.session.challenge
      })
      // const defaultApps = ['explorer', 'sdm', 'sca', 'spklexcel']
      // await Promise.all(
      //   defaultApps.map((appId) =>
      //     createAuthorizationCode({
      //       appId,
      //       userId: req.user.id,
      //       challenge: req.session.challenge
      //     })
      //   )
      // )
      if (req.session) req.session.destroy()
      return res.redirect(`${process.env.CANONICAL_URL}?access_code=${ac}`)
    } catch (err) {
      sentry({ err })
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
