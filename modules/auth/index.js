'use strict'
const appRoot = require( 'app-root-path' )

const redis = require( 'redis' )
const ExpressSession = require( 'express-session' )
const RedisStore = require( 'connect-redis' )( ExpressSession )
const passport = require( 'passport' )
const debug = require( 'debug' )

const sentry = require( `${appRoot}/logging/sentryHelper` )
const { getApp, getAllAppsAuthorizedByUser, createAuthorizationCode, createAppTokenFromAccessCode, refreshAppToken } = require( './services/apps' )
const { createPersonalAccessToken, validateToken, revokeTokenById } = require( `${appRoot}/modules/core/services/tokens` )
const { revokeRefreshToken } = require( `${appRoot}/modules/auth/services/apps` )
const { validateScopes, contextMiddleware } = require( `${appRoot}/modules/shared` )

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
    cookie: { maxAge: 1000 * 60 * 3 } // 3 minutes
  } )

  let sessionStorage = ( req, res, next ) => {
    if ( !req.query.challenge )
      return res.status( 400 ).send( 'Invalid request: no challenge detected.' )

    req.session.challenge = req.query.challenge
    if ( req.query.suuid ) {
      req.session.suuid = req.query.suuid
    }
    next( )
  }

  /*
  Finalizes authentication for the main frontend application.
   */
  let finalizeAuth = async ( req, res, next ) => {
    try {
      let app = await getApp( { id: 'spklwebapp' } )
      let ac = await createAuthorizationCode( { appId: 'spklwebapp', userId: req.user.id, challenge: req.session.challenge } )

      if ( req.session ) req.session.destroy( )
      return res.redirect( `${app.redirectUrl}?access_code=${ac}` )
    } catch ( err ) {
      sentry( { err } )
      if ( req.session ) req.session.destroy( )
      return res.status( 401 ).send( 'Invalid request.' )
    }
  }

  /*
  Strategies initialisation & listing
  */

  let strategyCount = 0

  if ( process.env.STRATEGY_GOOGLE === 'true' ) {
    let googStrategy = require( './strategies/google' )( app, session, sessionStorage, finalizeAuth )
    authStrategies.push( googStrategy )
    strategyCount++
  }

  if ( process.env.STRATEGY_GITHUB === 'true' ) {
    let githubStrategy = require( './strategies/github' )( app, session, sessionStorage, finalizeAuth )
    authStrategies.push( githubStrategy )
    strategyCount++
  }

  // Note: always leave the local strategy init for last so as to be able to
  // force enable it in case no others are present.
  if ( process.env.STRATEGY_LOCAL === 'true' || strategyCount === 0 ) {
    let localStrategy = require( './strategies/local' )( app, session, sessionStorage, finalizeAuth )
    authStrategies.push( localStrategy )
  }

  /*
  Auth routes
  */

  /*
  Generates an access code for an app.
   */
  app.get( '/auth/accesscode', async( req, res, next ) => {
    try {
      let appId = req.query.appId
      let app = await getApp( { id: appId } )
      if ( !app ) throw new Error( 'App does not exist.' )

      let challenge = req.query.challenge
      let userToken = req.query.token

      // 1. Validate token
      let { valid, scopes, userId, role } = await validateToken( userToken )
      if ( !valid ) throw new Error( 'Invalid token' )

      // 2. Validate token scopes
      await validateScopes( scopes, 'tokens:write' )

      let ac = await createAuthorizationCode( { appId, userId, challenge } )
      return res.redirect( `${app.redirectUrl}?access_code=${ac}` )

    } catch ( err ) {
      sentry( { err } )
      debug( 'speckle:errors' )( err )
      return res.status( 400 ).send( err.message )
    }
  } )

  /*
  Generates a new api token: (1) either via a valid refresh token or (2) via a valid access token
   */
  app.post( '/auth/token', async ( req, res, next ) => {
    try {
      // Token refresh
      if ( req.body.refreshToken ) {
        if ( !req.body.appId || !req.body.appSecret )
          throw new Error( 'Invalid request - refresh token' )

        let authResponse = await refreshAppToken( { refreshToken: req.body.refreshToken, appId: req.body.appId, appSecret: req.body.appSecret } )
        return res.send( authResponse )
      }

      // Access-code - token exchange
      if ( !req.body.appId || !req.body.appSecret || !req.body.accessCode || !req.body.challenge )
        throw new Error( 'Invalid request' + JSON.stringify( req.body ) )

      let authResponse = await createAppTokenFromAccessCode( { appId: req.body.appId, appSecret: req.body.appSecret, accessCode: req.body.accessCode, challenge: req.body.challenge } )
      return res.send( authResponse )
    } catch ( err ) {
      sentry( { err } )
      return res.status( 401 ).send( { err: err.message } )
    }
  } )

  /*
  Ensures a user is logged out by invalidating their token and refresh token.
   */
  app.post( '/auth/logout', async ( req, res, next ) => {
    try {
      let token = req.body.token
      let refreshToken = req.body.refreshToken

      if ( !token ) throw new Error( 'Invalid request' )
      await revokeTokenById( token )

      if ( refreshToken )
        revokeRefreshToken( { tokenId:refreshToken } )

      return res.status( 200 ).send( { message: 'You have logged out.' } )

    } catch ( err ){
      sentry( { err } )
      return res.status( 400 ).send( { err: err.message } )
    }
  } )
}
