'use strict'
const appRoot = require( 'app-root-path' )

const redis = require( 'redis' )
const ExpressSession = require( 'express-session' )
const RedisStore = require( 'connect-redis' )( ExpressSession )
const passport = require( 'passport' )
const debug = require( 'debug' )

const sentry = require( `${appRoot}/logging/sentryHelper` )
const { getApp, createAuthorizationCode, createAppTokenFromAccessCode, refreshAppToken } = require( './services/apps' )
const { createPersonalAccessToken } = require( `${appRoot}/modules/core/services/tokens` )

let authStrategies = [ ]

exports.authStrategies = authStrategies

exports.init = ( app, options ) => {
  debug( 'speckle:modules' )( '🔑 \tInit app, authn and authz module' )

  passport.serializeUser( ( user, done ) => done( null, user ) )
  passport.deserializeUser( ( user, done ) => done( null, user ) )
  app.use( passport.initialize( ) )

  let session = ExpressSession( {
    store: new RedisStore( { client: redis.createClient( process.env.REDIS_URL ) } ),
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 60000 * 60 }
  } )

  let sessionAppId = ( req, res, next ) => {

    req.session.appId = req.query.appId
    req.session.challenge = req.query.challenge
    next( )

  }

  let finalizeAuth = async ( req, res, next ) => {

    if ( req.session.appId ) {

      try {

        let app = await getApp( { id: req.session.appId } )
        let ac = await createAuthorizationCode( { appId: app.id, userId: req.user.id, challenge: req.session.challenge } )
        return res.redirect( `/auth/finalize?appId=${req.session.appId}&access_code=${ac}` )

      } catch ( err ) {

        sentry( { err } )
        res.status( 401 ).send( 'Invalid request.' )

      }

    } else {

      if ( process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ) {

        let token = await createPersonalAccessToken( req.user.id, 'test token', [ 'streams:write', 'streams:read', 'profile:read', 'profile:email', 'users:read', 'users:email' ] )
        return res.status( 200 ).send( { userId: req.user.id, apiToken: token } )

      }

      return res.status( 200 ).end( )

    }
  }

  // TODO: add cors
  app.post( '/auth/token', async ( req, res, next ) => {

    try {

      if ( req.body.refreshToken ) {
        if ( !req.body.appId || !req.body.appSecret )
          throw new Error( 'Invalid request - refresh token' )

        let authResponse = await refreshAppToken( { refreshToken: req.body.refreshToken, appId: req.body.appId, appSecret: req.body.appSecret } )
        return res.send( authResponse )
      }

      if ( !req.body.appId || !req.body.appSecret || !req.body.accessCode || !req.body.challenge )
        throw new Error( 'Invalid request' + JSON.stringify( req.body ) )

      let authResponse = await createAppTokenFromAccessCode( { appId: req.body.appId, appSecret: req.body.appSecret, accessCode: req.body.accessCode, challenge: req.body.challenge } )
      return res.send( authResponse )

    } catch ( err ) {

      sentry( { err } )
      return res.status( 401 ).send( { err: err.message } )

    }

  } )

  // TODO: add logout route


  // Strategies initialisation & listing
  // NOTE: if no strategies are defined, the local one will be enabled.

  let strategyCount = 0

  if ( process.env.STRATEGY_GITHUB === 'true' ) {
    let githubStrategy = require( './strategies/github' )( app, session, sessionAppId, finalizeAuth )
    authStrategies.push( githubStrategy )
    strategyCount++
  }

  if ( process.env.STRATEGY_GOOGLE === 'true' ) {
    let googStrategy = require( './strategies/google' )( app, session, sessionAppId, finalizeAuth )
    authStrategies.push( googStrategy )
    strategyCount++
  }

  // Note: always leave the local strategy init for last so as to be able to
  // force enable it in case no others are present.
  if ( process.env.STRATEGY_LOCAL === 'true' || strategyCount === 0 ) {
    let localStrategy = require( './strategies/local' )( app, session, sessionAppId, finalizeAuth )
    authStrategies.push( localStrategy )
  }

}
